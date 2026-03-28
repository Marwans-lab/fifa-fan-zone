import http from "node:http";
import https from "node:https";
import { execSync } from "node:child_process";

// --- Config ---
const PORT = 3457;
const LINEAR_API = "https://api.linear.app/graphql";
const LINEAR_TOKEN = process.env.LINEAR_TOKEN;
const GITHUB_REPO = "Marwans-lab/fifa-fan-zone";
const LINEAR_PERSONAL_KEY = process.env.LINEAR_PERSONAL_KEY || "";

// Cursor's Linear user ID — assigning an issue to this user triggers Cursor Cloud Agent
const CURSOR_USER_ID = "2117cef0-f13e-4281-8295-cb0b5fa505ea";

if (!LINEAR_TOKEN) {
  console.error("ERROR: LINEAR_TOKEN env var is required");
  process.exit(1);
}

// --- Trigger GitHub Actions poller on demand ---
let lastPollerTrigger = 0;
const POLLER_COOLDOWN = 30_000;

function triggerPoller(reason) {
  const now = Date.now();
  if (now - lastPollerTrigger < POLLER_COOLDOWN) {
    console.log(`[Pipeline] Poller trigger skipped (cooldown) — ${reason}`);
    return;
  }
  lastPollerTrigger = now;
  try {
    execSync(
      `gh workflow run linear-poll.yml -R ${GITHUB_REPO} 2>&1`,
      { encoding: "utf-8", timeout: 10_000 }
    );
    console.log(`[Pipeline] Poller triggered — ${reason}`);
  } catch (e) {
    console.error(`[Pipeline] Poller trigger failed: ${e.message}`);
  }
}

// --- Helpers ---
function linearGQL(query, variables, token) {
  token = token || LINEAR_TOKEN;
  const body = JSON.stringify({ query, variables });
  return new Promise((resolve, reject) => {
    const req = https.request(
      LINEAR_API,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(data));
          }
        });
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

async function postComment(issueId, body) {
  const token = LINEAR_PERSONAL_KEY || LINEAR_TOKEN;
  const result = await linearGQL(
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body },
    token
  );
  console.log(`[Pipeline] Comment posted on issue ${issueId}`);
  return result;
}

async function transitionIssue(issueId, stateId) {
  return linearGQL(
    `mutation($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
      }
    }`,
    { issueId, stateId }
  );
}

async function assignIssue(issueId, assigneeId) {
  return linearGQL(
    `mutation($issueId: String!, $assigneeId: String!) {
      issueUpdate(id: $issueId, input: { assigneeId: $assigneeId }) {
        success
      }
    }`,
    { issueId, assigneeId }
  );
}

// --- State name cache ---
let stateCache = null;

async function getStates(teamId) {
  if (stateCache) return stateCache;
  const result = await linearGQL(
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name type } }
      }
    }`,
    { teamId }
  );
  stateCache = result.data.team.states.nodes;
  console.log(`[Pipeline] Cached ${stateCache.length} workflow states`);
  return stateCache;
}

function findState(states, name) {
  return states.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

// --- Debounce: ignore events we ourselves triggered ---
const recentComments = new Set();

function markOurComment(issueId) {
  recentComments.add(issueId);
  setTimeout(() => recentComments.delete(issueId), 10_000);
}

// Track recently triggered issues to prevent duplicate assignments
const recentTriggers = new Map();
const TRIGGER_COOLDOWN = 20 * 60_000; // 20 min

// In-process mutex
let _triggerInFlight = false;

// --- Trigger Cursor Cloud Agent by assigning the issue ---
async function triggerCursor(issueId, issueIdentifier) {
  // Deduplication
  const lastTrigger = recentTriggers.get(issueId);
  if (lastTrigger && Date.now() - lastTrigger < TRIGGER_COOLDOWN) {
    console.log(`[Pipeline] ${issueIdentifier}: Skipping trigger — cooldown active (last: ${Math.round((Date.now() - lastTrigger) / 60_000)}min ago)`);
    return false;
  }

  // Mutex: only one trigger at a time
  if (_triggerInFlight) {
    console.log(`[Pipeline] ${issueIdentifier}: Skipping trigger — another trigger already in flight`);
    return false;
  }
  _triggerInFlight = true;

  try {
    // Serialization: only one active session at a time
    try {
      const activeResult = await linearGQL(
        `query { issues(filter: { team: { key: { eq: "MAR" } }, project: { id: { eq: "978662f2-57f8-44e3-9a5b-1e8059819bd8" } }, state: { name: { in: ["In Progress"] } }, archivedAt: { null: true } }, first: 10) { nodes { id identifier } } }`,
        {}
      );
      const otherActive = (activeResult.data?.issues?.nodes || []).filter(i => i.id !== issueId);
      if (otherActive.length > 0) {
        console.log(`[Pipeline] ${issueIdentifier}: Skipping trigger — ${otherActive.map(i => i.identifier).join(", ")} already In Progress. Will retry next cycle.`);
        return false;
      }
    } catch (e) {
      console.warn(`[Pipeline] ${issueIdentifier}: Could not check for active sessions: ${e.message} — proceeding anyway`);
    }

    // Assign to Cursor — this triggers Cursor Cloud Agent automatically
    await assignIssue(issueId, CURSOR_USER_ID);
    console.log(`[Pipeline] ${issueIdentifier}: Assigned to Cursor Cloud Agent`);

    recentTriggers.set(issueId, Date.now());

    // Immediately mark In Progress so the serialization gate sees it
    try {
      const states = await getStates("9fb7888e-f60c-4316-b50e-fa1f4d782193");
      const inProgressState = findState(states, "In Progress");
      if (inProgressState) {
        markOurComment(issueId);
        await transitionIssue(issueId, inProgressState.id);
        console.log(`[Pipeline] ${issueIdentifier}: Moved to In Progress`);
      }
    } catch (e) {
      console.warn(`[Pipeline] ${issueIdentifier}: Could not set In Progress: ${e.message}`);
    }

    return true;
  } finally {
    _triggerInFlight = false;
  }
}

// --- Pipeline logic ---
async function handleWebhook(payload) {
  if (payload.type !== "Issue" || payload.action !== "update") return;
  if (!payload.data?.state?.name || !payload.updatedFrom?.stateId) return;

  const newState = payload.data.state.name;
  const issueId = payload.data.id;
  const issueIdentifier = payload.data.identifier || payload.data.id;
  const teamId = payload.data.teamId;

  console.log(`[Pipeline] ${issueIdentifier} → ${newState}`);

  // Trigger cloud poller on every state change
  triggerPoller(`${issueIdentifier} → ${newState}`);

  // In Review → Done (Cursor validates its own work before opening PR)
  if (newState === "In Review") {
    if (recentComments.has(issueId)) return;
    markOurComment(issueId);

    const states = await getStates(teamId);
    const doneState = findState(states, "Done");
    if (doneState) {
      await transitionIssue(issueId, doneState.id);
      console.log(`[Pipeline] ${issueIdentifier}: In Review → Done`);
    }
    return;
  }

  // Done → merge PR → deploy → Deployed
  if (newState === "Done") {
    if (recentComments.has(issueId)) return;
    markOurComment(issueId);

    console.log(`[Pipeline] ${issueIdentifier}: Starting deploy`);
    try {
      const prJson = execSync(
        `gh pr list -R ${GITHUB_REPO} --state open --json number,title,headRefName --search "${issueIdentifier}" 2>/dev/null`,
        { encoding: "utf-8" }
      );
      const prs = JSON.parse(prJson || "[]");
      const pr = prs.find(
        (p) =>
          p.title.includes(issueIdentifier) ||
          p.headRefName.toLowerCase().includes(issueIdentifier.toLowerCase())
      );

      if (!pr) {
        const mergedJson = execSync(
          `gh pr list -R ${GITHUB_REPO} --state merged --json number,title,headRefName --search "${issueIdentifier}" 2>/dev/null`,
          { encoding: "utf-8" }
        );
        const mergedPrs = JSON.parse(mergedJson || "[]");
        const mergedPr = mergedPrs.find(
          (p) =>
            p.title.includes(issueIdentifier) ||
            p.headRefName.toLowerCase().includes(issueIdentifier.toLowerCase())
        );

        if (mergedPr) {
          console.log(`[Pipeline] ${issueIdentifier}: PR #${mergedPr.number} already merged — moving to Deployed`);
          const states = await getStates(teamId);
          const deployedState = findState(states, "Deployed");
          if (deployedState) {
            await transitionIssue(issueId, deployedState.id);
            await postComment(issueId, `**[DEPLOYED]** PR #${mergedPr.number} was already merged. Auto-transitioning to Deployed.`);
          }
        } else {
          console.log(`[Pipeline] ${issueIdentifier}: No open or merged PR found — skipping deploy`);
          await postComment(issueId, `**[DEPLOY SKIPPED]** No open or merged PR found for ${issueIdentifier}. Issue stays at Done — stall detector will retry.`);
        }
        return;
      }

      console.log(`[Pipeline] ${issueIdentifier}: Merging PR #${pr.number}`);
      execSync(
        `gh pr merge ${pr.number} -R ${GITHUB_REPO} --squash --delete-branch 2>&1`,
        { encoding: "utf-8" }
      );

      console.log(`[Pipeline] ${issueIdentifier}: Waiting for GitHub Pages deploy...`);
      let deployed = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((r) => setTimeout(r, 10_000));
        try {
          const runJson = execSync(
            `gh run list -R ${GITHUB_REPO} --workflow deploy.yml --limit 1 --json status,conclusion 2>/dev/null`,
            { encoding: "utf-8" }
          );
          const runs = JSON.parse(runJson || "[]");
          if (runs[0]?.status === "completed") {
            if (runs[0].conclusion === "success") deployed = true;
            break;
          }
        } catch { /* keep waiting */ }
      }

      if (deployed) {
        const states = await getStates(teamId);
        const deployedState = findState(states, "Deployed");
        if (deployedState) {
          await transitionIssue(issueId, deployedState.id);
          console.log(`[Pipeline] ${issueIdentifier}: Deployed successfully`);
          await postComment(issueId, `**[DEPLOYED]** PR #${pr.number} merged and deployed to GitHub Pages.`);
        }
      } else {
        console.log(`[Pipeline] ${issueIdentifier}: Deploy not confirmed`);
        await postComment(issueId, `**[DEPLOY FAILED]** PR #${pr.number} merged but deploy not confirmed. Issue stays at Done.`);
      }
    } catch (e) {
      console.error(`[Pipeline] ${issueIdentifier}: Deploy error: ${e.message}`);
      await postComment(issueId, `**[DEPLOY FAILED]** Error: ${e.message}`);
    }
    return;
  }

  // Todo → assign to Cursor Cloud Agent
  if (newState === "Todo") {
    if (recentComments.has(issueId)) return;
    markOurComment(issueId);
    await triggerCursor(issueId, issueIdentifier);
    return;
  }
}

// --- Stall detector ---
const STALL_CHECK_INTERVAL = 10 * 60_000;
const STALL_THRESHOLD = 20 * 60_000; // 20 min (Cursor sessions can take a bit longer)
const retriggeredRecently = new Map();

async function checkForStalledIssues() {
  try {
    const result = await linearGQL(
      `query {
        issues(filter: {
          team: { key: { eq: "MAR" } },
          state: { name: { in: ["Todo", "In Progress", "In Review", "Done"] } }
        }, first: 50) {
          nodes {
            id identifier title
            state { name }
            updatedAt
            team { id }
          }
        }
      }`,
      {}
    );

    const issues = result.data?.issues?.nodes || [];
    const now = Date.now();
    const IGNORE_ISSUES = new Set(["MAR-1", "MAR-2", "MAR-3", "MAR-4"]);

    for (const issue of issues) {
      if (IGNORE_ISSUES.has(issue.identifier)) continue;

      const stateName = issue.state.name;
      const lastUpdate = new Date(issue.updatedAt).getTime();
      const stalledMinutes = Math.round((now - lastUpdate) / 60_000);

      const lastRetrigger = retriggeredRecently.get(issue.id);
      if (lastRetrigger && now - lastRetrigger < 30 * 60_000) continue;

      // Done → check for unmerged / already-merged PRs
      if (stateName === "Done") {
        if (now - lastUpdate < STALL_THRESHOLD) continue;
        try {
          const prJson = execSync(
            `gh pr list -R ${GITHUB_REPO} --state open --json number,title,headRefName --search "${issue.identifier}" 2>/dev/null`,
            { encoding: "utf-8" }
          );
          const prs = JSON.parse(prJson || "[]");
          const pr = prs.find(
            (p) =>
              p.title.includes(issue.identifier) ||
              p.headRefName.toLowerCase().includes(issue.identifier.toLowerCase())
          );

          if (pr) {
            console.log(`[Pipeline] STALL: ${issue.identifier} (Done) has unmerged PR #${pr.number} — merging`);
            retriggeredRecently.set(issue.id, now);

            let mergeState = "UNKNOWN";
            try {
              const prInfo = JSON.parse(execSync(
                `gh pr view ${pr.number} -R ${GITHUB_REPO} --json mergeStateStatus 2>/dev/null`,
                { encoding: "utf-8" }
              ));
              mergeState = prInfo.mergeStateStatus;
            } catch { /* ignore */ }

            if (mergeState === "DIRTY" || mergeState === "CONFLICTING") {
              console.log(`[Pipeline] ${issue.identifier}: PR #${pr.number} has conflicts — closing and resetting to Todo`);
              try {
                execSync(`gh pr close ${pr.number} -R ${GITHUB_REPO} --comment "Closing due to merge conflicts. Resetting to Todo." 2>&1`, { encoding: "utf-8" });
              } catch { /* ignore */ }
              const states = await getStates(issue.team.id);
              const todoState = findState(states, "Todo");
              if (todoState) {
                markOurComment(issue.id);
                await transitionIssue(issue.id, todoState.id);
              }
              continue;
            }

            try {
              execSync(`gh pr merge ${pr.number} -R ${GITHUB_REPO} --squash --delete-branch 2>&1`, { encoding: "utf-8" });
              console.log(`[Pipeline] ${issue.identifier}: PR #${pr.number} merged by stall detector`);

              let deployed = false;
              for (let attempt = 0; attempt < 20; attempt++) {
                await new Promise((r) => setTimeout(r, 10_000));
                try {
                  const runJson = execSync(
                    `gh run list -R ${GITHUB_REPO} --workflow deploy.yml --limit 1 --json status,conclusion 2>/dev/null`,
                    { encoding: "utf-8" }
                  );
                  const runs = JSON.parse(runJson || "[]");
                  if (runs[0]?.status === "completed") {
                    if (runs[0].conclusion === "success") deployed = true;
                    break;
                  }
                } catch { /* keep waiting */ }
              }

              const states = await getStates(issue.team.id);
              const deployedState = findState(states, "Deployed");
              if (deployed && deployedState) {
                await transitionIssue(issue.id, deployedState.id);
                await postComment(issue.id, `**[PIPELINE]** Stall detector merged PR #${pr.number} and deployed.`);
              } else {
                await postComment(issue.id, `**[PIPELINE]** PR #${pr.number} merged but deploy not confirmed.`);
              }
            } catch (mergeErr) {
              console.error(`[Pipeline] ${issue.identifier}: Merge failed: ${mergeErr.message}`);
            }
          } else {
            retriggeredRecently.set(issue.id, now);
            const mergedJson = execSync(
              `gh pr list -R ${GITHUB_REPO} --state merged --json number,title,headRefName --search "${issue.identifier}" 2>/dev/null`,
              { encoding: "utf-8" }
            );
            const mergedPrs = JSON.parse(mergedJson || "[]");
            const mergedPr = mergedPrs.find(
              (p) =>
                p.title.includes(issue.identifier) ||
                p.headRefName.toLowerCase().includes(issue.identifier.toLowerCase())
            );

            if (mergedPr) {
              console.log(`[Pipeline] STALL: ${issue.identifier} (Done) merged PR #${mergedPr.number} not transitioned — moving to Deployed`);
              const states = await getStates(issue.team.id);
              const deployedState = findState(states, "Deployed");
              if (deployedState) {
                markOurComment(issue.id);
                await transitionIssue(issue.id, deployedState.id);
              }
            } else {
              // No PR at all — reset to Todo so Cursor picks it up again
              console.log(`[Pipeline] STALL: ${issue.identifier} (Done) has no PR — resetting to Todo`);
              const states = await getStates(issue.team.id);
              const todoState = findState(states, "Todo");
              if (todoState) {
                markOurComment(issue.id);
                await transitionIssue(issue.id, todoState.id);
              }
            }
          }
        } catch (e) {
          console.error(`[Pipeline] ${issue.identifier}: Done stall check error: ${e.message}`);
        }
        continue;
      }

      // In Review → Done if stalled
      if (stateName === "In Review") {
        if (now - lastUpdate < STALL_THRESHOLD) continue;
        console.log(`[Pipeline] STALL: ${issue.identifier} (In Review) — ${stalledMinutes}min, moving to Done`);
        const states = await getStates(issue.team.id);
        const doneState = findState(states, "Done");
        if (doneState) {
          markOurComment(issue.id);
          await transitionIssue(issue.id, doneState.id);
        }
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      // Todo / In Progress → re-assign to Cursor if stalled
      if (now - lastUpdate < STALL_THRESHOLD) continue;

      // Serialization check
      try {
        const activeResult = await linearGQL(
          `query { issues(filter: { team: { key: { eq: "MAR" } }, project: { id: { eq: "978662f2-57f8-44e3-9a5b-1e8059819bd8" } }, state: { name: { in: ["In Progress"] } }, archivedAt: { null: true } }, first: 10) { nodes { id identifier } } }`,
          {}
        );
        const otherActive = (activeResult.data?.issues?.nodes || []).filter(i => i.id !== issue.id);
        if (otherActive.length > 0) {
          console.log(`[Pipeline] ${issue.identifier}: Skip retrigger — ${otherActive.map(i => i.identifier).join(", ")} already In Progress`);
          continue;
        }
      } catch (e) {
        console.warn(`[Pipeline] ${issue.identifier}: Could not check active sessions: ${e.message}`);
      }

      console.log(`[Pipeline] STALL: ${issue.identifier} (${stateName}) — ${stalledMinutes}min, re-assigning to Cursor`);

      // Reset to Todo first so the assignment triggers a fresh session
      if (stateName === "In Progress") {
        const states = await getStates(issue.team.id);
        const todoState = findState(states, "Todo");
        if (todoState) {
          markOurComment(issue.id);
          await transitionIssue(issue.id, todoState.id);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      await triggerCursor(issue.id, issue.identifier);
      retriggeredRecently.set(issue.id, now);
      break; // one at a time
    }
  } catch (e) {
    console.error(`[Pipeline] Stall detector error: ${e.message}`);
  }
}

setInterval(checkForStalledIssues, STALL_CHECK_INTERVAL);
setTimeout(checkForStalledIssues, 30_000);
console.log(`[Pipeline] Stall detector enabled (every ${STALL_CHECK_INTERVAL / 60_000}min, threshold ${STALL_THRESHOLD / 60_000}min)`);

// --- Server ---
const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "pipeline-ok", agent: "cursor-cloud" }));
    return;
  }

  // Manual trigger: POST /trigger/:identifier
  if (req.method === "POST" && req.url.startsWith("/trigger/")) {
    const identifier = req.url.slice("/trigger/".length);
    try {
      const d = (await linearGQL(
        `query($id: String!) { issue(id: $id) { id identifier title } }`,
        { id: identifier }
      )).data?.issue;
      if (!d) throw new Error(`Issue ${identifier} not found`);
      console.log(`[Pipeline] Manual trigger: ${d.identifier}`);
      recentTriggers.delete(d.id);
      const ok = await triggerCursor(d.id, d.identifier);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ triggered: ok, issue: d.identifier }));
    } catch (e) {
      console.error(`[Pipeline] Manual trigger failed: ${e.message}`);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Collect body
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    // Process pipeline logic for webhook events
    if (req.url === "/webhook" && req.method === "POST") {
      try {
        const payload = JSON.parse(body);
        await handleWebhook(payload);
      } catch (e) {
        console.error(`[Pipeline] Error processing webhook: ${e.message}`);
      }
    }

    res.writeHead(200);
    res.end('{"success":true}');
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[Pipeline] Running on http://127.0.0.1:${PORT}`);
  console.log(`[Pipeline] Agent: Cursor Cloud (user ${CURSOR_USER_ID})`);
  console.log(`[Pipeline] Flow: Todo → assign Cursor → In Progress → In Review → Done → merge PR → Deployed`);
});
