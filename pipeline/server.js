import http from "node:http";
import https from "node:https";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// --- Config ---
const PORT = 3457;
const CYRUS_PORT = 3456;
const LINEAR_API = "https://api.linear.app/graphql";
const LINEAR_TOKEN = process.env.LINEAR_TOKEN;
const GITHUB_REPO = "Marwans-lab/fifa-fan-zone";
const CYRUS_API_KEY = process.env.CYRUS_API_KEY || "";
// Personal API key for posting comments — uses a different identity than Claude agent
// so Cyrus won't ignore them as self-comments
const LINEAR_PERSONAL_KEY = process.env.LINEAR_PERSONAL_KEY || "";

if (!LINEAR_TOKEN) {
  console.error("ERROR: LINEAR_TOKEN env var is required");
  process.exit(1);
}

// --- Trigger GitHub Actions poller on demand ---
let lastPollerTrigger = 0;
const POLLER_COOLDOWN = 30_000; // min 30s between triggers

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

async function postComment(issueId, body, { asAgent = false } = {}) {
  // By default: use personal API key so comments come from the user identity.
  // asAgent: use LINEAR_TOKEN (Cyrus OAuth) — for non-trigger comments like
  // deploy status, QA results, etc. where we DON'T need Cyrus to act on them.
  //
  // IMPORTANT: Neither personal key nor Cyrus OAuth triggers Cyrus sessions.
  // Only third-party OAuth (Arcade) comments trigger sessions. The pipeline
  // posts informational comments only — session triggering must come from
  // Arcade or user comments with @Claude.
  const token = asAgent ? LINEAR_TOKEN : (LINEAR_PERSONAL_KEY || LINEAR_TOKEN);
  const result = await linearGQL(
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body },
    token
  );
  console.log(`[Pipeline] Comment posted on issue ${issueId} (as ${asAgent ? "agent" : "user"})`);
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

function forwardToCyrus(method, url, headers, body) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: CYRUS_PORT,
        path: url,
        method,
        headers: {
          ...headers,
          host: `127.0.0.1:${CYRUS_PORT}`,
          authorization: `Bearer ${CYRUS_API_KEY}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on("error", (e) => {
      console.error(`[Pipeline] Forward to Cyrus failed: ${e.message}`);
      resolve({ status: 502, body: "Cyrus unreachable" });
    });
    req.end(body);
  });
}

// --- State name cache (fetched once) ---
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
  console.log(
    `[Pipeline] Cached ${stateCache.length} workflow states`
  );
  return stateCache;
}

function findState(states, name) {
  return states.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

// --- Debounce: ignore events we ourselves triggered ---
const recentComments = new Set();

function markOurComment(issueId) {
  const key = issueId;
  recentComments.add(key);
  setTimeout(() => recentComments.delete(key), 10_000);
}

// Track recently triggered issues to prevent duplicate sessions
// issueId → timestamp of last trigger
const recentTriggers = new Map();
const TRIGGER_COOLDOWN = 20 * 60_000; // 20 min cooldown between triggers per issue

// In-process mutex: prevents two simultaneous trigger calls from both passing
// the "0 In Progress" check before either has transitioned the issue to In Progress.
let _triggerInFlight = false;

// Helper: create a Linear AgentSession and trigger Cyrus via AgentSessionEvent
async function triggerCyrus(issueId, issueIdentifier) {
  // Deduplication: skip if triggered recently
  const lastTrigger = recentTriggers.get(issueId);
  if (lastTrigger && Date.now() - lastTrigger < TRIGGER_COOLDOWN) {
    console.log(`[Pipeline] ${issueIdentifier}: Skipping trigger — cooldown active (last: ${Math.round((Date.now() - lastTrigger) / 60_000)}min ago)`);
    return false;
  }

  // In-process mutex: only one trigger can proceed at a time (prevents race where
  // two simultaneous webhooks both see "0 In Progress" before either sets state).
  if (_triggerInFlight) {
    console.log(`[Pipeline] ${issueIdentifier}: Skipping trigger — another trigger already in flight.`);
    return false;
  }
  _triggerInFlight = true;

  try {
  // Serialization: only one active Cyrus session at a time.
  // Running parallel sessions causes conflicting PRs — each branches off a different commit.
  try {
    const activeResult = await linearGQL(
      `query { issues(filter: { team: { key: { eq: "MAR" } }, state: { name: { in: ["In Progress"] } } }, first: 10) { nodes { id identifier } } }`,
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

  // Fetch issue details for the prompt
  let issueTitle = issueIdentifier, issueDescription = "", issueUrl = "", labels = [];
  try {
    const d = (await linearGQL(
      `query($id: String!) { issue(id: $id) { title description url labels { nodes { id name } } } }`,
      { id: issueId }
    )).data?.issue;
    if (d) {
      issueTitle = d.title || issueIdentifier;
      issueDescription = d.description || "";
      issueUrl = d.url || "";
      labels = (d.labels?.nodes || []).map((l) => ({ id: l.id, name: l.name }));
    }
  } catch (e) {
    console.error(`[Pipeline] ${issueIdentifier}: Failed to fetch issue details: ${e.message}`);
  }

  // Create a real Linear AgentSession (required for Cyrus to sync activity)
  let sessionId;
  try {
    const r = await linearGQL(
      `mutation($input: AgentSessionCreateOnIssue!) {
        agentSessionCreateOnIssue(input: $input) { agentSession { id } success }
      }`,
      { input: { issueId } },
      LINEAR_TOKEN
    );
    sessionId = r.data?.agentSessionCreateOnIssue?.agentSession?.id;
    if (!sessionId) throw new Error("No session ID returned");
  } catch (e) {
    console.error(`[Pipeline] ${issueIdentifier}: Failed to create AgentSession: ${e.message}`);
    sessionId = randomUUID(); // fallback — Cyrus runs but can't sync to Linear
  }

  const payload = JSON.stringify({
    type: "AgentSessionEvent",
    action: "created",
    organizationId: "416d45de-7ee5-4dcc-aa1a-31bb4ec37aa3",
    createdAt: new Date().toISOString(),
    agentSession: {
      id: sessionId,
      status: "created",
      issue: { id: issueId, identifier: issueIdentifier, title: issueTitle, description: issueDescription, url: issueUrl, labels },
    },
  });

  try {
    const result = await forwardToCyrus(
      "POST", "/webhook",
      { "content-type": "application/json", "content-length": Buffer.byteLength(payload).toString() },
      payload
    );
    console.log(`[Pipeline] ${issueIdentifier}: Triggered Cyrus (session ${sessionId?.slice(0, 8)}, status ${result.status})`);
    recentTriggers.set(issueId, Date.now());
    // Immediately mark In Progress in Linear so the next serialization check
    // sees this issue as active before Cyrus has a chance to update it.
    try {
      const states = await getStates("9fb7888e-f60c-4316-b50e-fa1f4d782193");
      const inProgressState = findState(states, "In Progress");
      if (inProgressState) await transitionIssue(issueId, inProgressState.id);
    } catch (e) {
      console.warn(`[Pipeline] ${issueIdentifier}: Could not pre-set In Progress: ${e.message}`);
    }
    return true;
  } catch (e) {
    console.error(`[Pipeline] ${issueIdentifier}: Failed to trigger Cyrus: ${e.message}`);
    return false;
  }
  } finally {
    _triggerInFlight = false;
  }
}

// --- Pipeline logic ---
async function handleCommentWebhook(payload) {
  // No-op — QA via comment is removed (Cyrus validates internally).
  // Comment webhooks are still forwarded to Cyrus for AgentSession prompts.
}

async function handleWebhook(payload) {
  // Handle comment events (QA completion detection)
  if (payload.type === "Comment") {
    await handleCommentWebhook(payload);
    return;
  }

  // We only care about issue status changes
  if (payload.type !== "Issue" || payload.action !== "update") return;
  if (!payload.data?.state?.name || !payload.updatedFrom?.stateId) return;

  const newState = payload.data.state.name;
  const issueId = payload.data.id;
  const issueIdentifier = payload.data.identifier || payload.data.id;
  const teamId = payload.data.teamId;
  const labels = (payload.data.labels || []).map((l) => l.name);

  console.log(
    `[Pipeline] ${issueIdentifier} → ${newState} (labels: ${labels.join(", ") || "none"})`
  );

  // Trigger cloud poller on every state change — catches anything we miss
  triggerPoller(`${issueIdentifier} → ${newState}`);

  // Stage 2: In Review → Done (Cyrus validates internally during full-development)
  // QA via comment never worked (personal key doesn't trigger Cyrus).
  // Cyrus already runs validation as part of its procedure — trust it and move on.
  if (newState === "In Review") {
    if (recentComments.has(issueId)) return;
    markOurComment(issueId);

    const states = await getStates(teamId);
    const doneState = findState(states, "Done");
    if (doneState) {
      await transitionIssue(issueId, doneState.id);
      console.log(`[Pipeline] ${issueIdentifier}: In Review → Done (Cyrus validated internally)`);
    }
    return;
  }

  // Stage 3: Done → deploy directly (no Claude needed)
  if (newState === "Done") {
    if (recentComments.has(issueId)) return;
    markOurComment(issueId);

    console.log(`[Pipeline] ${issueIdentifier}: Starting deploy`);
    try {
      // Find open PR for this issue
      const prJson = execSync(
        `gh pr list -R ${GITHUB_REPO} --state open --json number,title,headRefName --search "${issueIdentifier}" 2>/dev/null`,
        { encoding: "utf-8" }
      );
      const prs = JSON.parse(prJson || "[]");
      const pr = prs.find(
        (p) =>
          p.title.includes(issueIdentifier) ||
          p.headRefName.toLowerCase().includes(issueIdentifier.toLowerCase().replace("-", "-"))
      );

      if (!pr) {
        // No open PR — check if one was already merged
        const mergedJson = execSync(
          `gh pr list -R ${GITHUB_REPO} --state merged --json number,title,headRefName --search "${issueIdentifier}" 2>/dev/null`,
          { encoding: "utf-8" }
        );
        const mergedPrs = JSON.parse(mergedJson || "[]");
        const mergedPr = mergedPrs.find(
          (p) =>
            p.title.includes(issueIdentifier) ||
            p.headRefName.toLowerCase().includes(issueIdentifier.toLowerCase().replace("-", "-"))
        );

        if (mergedPr) {
          // PR already merged — skip straight to Deployed
          console.log(`[Pipeline] ${issueIdentifier}: PR #${mergedPr.number} already merged — moving to Deployed`);
          const states = await getStates(teamId);
          const deployedState = findState(states, "Deployed");
          if (deployedState) {
            await transitionIssue(issueId, deployedState.id);
            await postComment(
              issueId,
              `**[DEPLOYED]** PR #${mergedPr.number} was already merged to main. Auto-transitioning to Deployed.`
            );
          }
        } else {
          console.log(`[Pipeline] ${issueIdentifier}: No open or merged PR found, skipping deploy`);
          await postComment(
            issueId,
            `**[DEPLOY SKIPPED]** No open or merged PR found for ${issueIdentifier}. Issue stays at Done — stall detector will move to Todo if unresolved.`
          );
        }
        return;
      }

      // Merge the PR
      console.log(`[Pipeline] ${issueIdentifier}: Merging PR #${pr.number}`);
      execSync(
        `gh pr merge ${pr.number} -R ${GITHUB_REPO} --squash --delete-branch 2>&1`,
        { encoding: "utf-8" }
      );

      // Wait for GitHub Actions deploy
      console.log(`[Pipeline] ${issueIdentifier}: Waiting for GitHub Pages deploy...`);
      let deployed = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((r) => setTimeout(r, 10_000));
        try {
          const runJson = execSync(
            `gh run list -R ${GITHUB_REPO} --limit 1 --json status,conclusion 2>/dev/null`,
            { encoding: "utf-8" }
          );
          const runs = JSON.parse(runJson || "[]");
          if (runs[0]?.status === "completed") {
            if (runs[0].conclusion === "success") {
              deployed = true;
            }
            break;
          }
        } catch {
          // keep waiting
        }
      }

      if (deployed) {
        // Move to Deployed
        const states = await getStates(teamId);
        const deployedState = findState(states, "Deployed");
        if (deployedState) {
          await transitionIssue(issueId, deployedState.id);
          console.log(`[Pipeline] ${issueIdentifier}: Deployed successfully`);
          await postComment(
            issueId,
            `**[DEPLOYED]** PR #${pr.number} merged and deployed to GitHub Pages.`
          );
        }
      } else {
        // Deploy failed — stay at Done with comment
        console.log(`[Pipeline] ${issueIdentifier}: Deploy failed`);
        await postComment(
          issueId,
          `**[DEPLOY FAILED]** PR #${pr.number} was merged but GitHub Pages deploy failed. Issue stays at Done — will retry on next status change or investigate manually.`
        );
      }
    } catch (e) {
      console.error(`[Pipeline] ${issueIdentifier}: Deploy error: ${e.message}`);
      await postComment(
        issueId,
        `**[DEPLOY FAILED]** Error during deploy: ${e.message}\n\nIssue stays at Done.`
      );
    }
    return;
  }

  // Stage 1: Todo → Cyrus handles it via the forwarded real Linear webhook.
  // The middleware already forwarded the webhook above (with valid Linear signature),
  // so Cyrus will start a session automatically. No extra trigger needed.
  if (newState === "Todo") {
    return;
  }
}

// --- Stall detector: auto-retrigger stuck issues ---
// Periodically checks for Todo/In Progress issues that haven't had activity
// and re-posts @Claude to kick Cyrus back into action (e.g. after rate limits).
const STALL_CHECK_INTERVAL = 10 * 60_000; // every 10 minutes
const STALL_THRESHOLD = 15 * 60_000; // issue stuck for 15+ minutes = stalled
const retriggeredRecently = new Map(); // issueId → timestamp

async function checkForStalledIssues() {
  try {
    // Fetch all active issues (Todo, In Progress, In Review, Done) in MAR
    const result = await linearGQL(
      `query {
        issues(filter: {
          team: { key: { eq: "MAR" } },
          state: { name: { in: ["Todo", "In Progress", "In Review", "Done"] } }
        }, first: 50) {
          nodes {
            id
            identifier
            title
            state { name }
            updatedAt
            team { id }
            labels { nodes { name } }
            comments { nodes { body createdAt } }
          }
        }
      }`,
      {}
    );

    const issues = result.data?.issues?.nodes || [];
    const now = Date.now();

    // Skip onboarding template issues
    const IGNORE_ISSUES = new Set(["MAR-1", "MAR-2", "MAR-3", "MAR-4"]);

    for (const issue of issues) {
      if (IGNORE_ISSUES.has(issue.identifier)) continue;

      const stateName = issue.state.name;
      const lastUpdate = new Date(issue.updatedAt).getTime();
      const stalledMinutes = Math.round((now - lastUpdate) / 60_000);

      // Skip if we retriggered this issue recently (within 30 min)
      const lastRetrigger = retriggeredRecently.get(issue.id);
      if (lastRetrigger && now - lastRetrigger < 30 * 60_000) continue;

      // --- Done issues: auto-merge unmerged PRs ---
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
              p.headRefName.toLowerCase().includes(issue.identifier.toLowerCase().replace("-", "-"))
          );
          if (pr) {
            console.log(`[Pipeline] STALL DETECTED: ${issue.identifier} (Done) has unmerged PR #${pr.number} — merging now`);
            retriggeredRecently.set(issue.id, now);
            // Check mergeability before trying — CONFLICTING PRs need a rebase
            let mergeState = "UNKNOWN";
            try {
              const prInfo = JSON.parse(execSync(
                `gh pr view ${pr.number} -R ${GITHUB_REPO} --json mergeStateStatus 2>/dev/null`,
                { encoding: "utf-8" }
              ));
              mergeState = prInfo.mergeStateStatus;
            } catch { /* ignore */ }

            if (mergeState === "DIRTY" || mergeState === "CONFLICTING") {
              console.log(`[Pipeline] ${issue.identifier}: PR #${pr.number} has conflicts (${mergeState}) — closing PR and resetting to Todo for fresh re-implementation`);
              try {
                execSync(
                  `gh pr close ${pr.number} -R ${GITHUB_REPO} --comment "Closing due to merge conflicts. Resetting to Todo for fresh implementation on latest main." 2>&1`,
                  { encoding: "utf-8" }
                );
              } catch { /* ignore close errors */ }
              const states = await getStates(issue.team.id);
              const todoState = findState(states, "Todo");
              if (todoState) {
                markOurComment(issue.id);
                await transitionIssue(issue.id, todoState.id);
                console.log(`[Pipeline] ${issue.identifier}: Reset to Todo after closing conflicting PR #${pr.number}`);
              }
              retriggeredRecently.set(issue.id, now);
              continue;
            }

            try {
              execSync(
                `gh pr merge ${pr.number} -R ${GITHUB_REPO} --squash --delete-branch 2>&1`,
                { encoding: "utf-8" }
              );
              console.log(`[Pipeline] ${issue.identifier}: PR #${pr.number} merged by stall detector`);

              // Wait for GitHub Actions deploy (same verification as main handler)
              let deployed = false;
              for (let attempt = 0; attempt < 20; attempt++) {
                await new Promise((r) => setTimeout(r, 10_000));
                try {
                  const runJson = execSync(
                    `gh run list -R ${GITHUB_REPO} --limit 1 --json status,conclusion 2>/dev/null`,
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
                const states = await getStates(issue.team.id);
                const deployedState = findState(states, "Deployed");
                if (deployedState) {
                  await transitionIssue(issue.id, deployedState.id);
                  await postComment(issue.id, `**[PIPELINE]** Stall detector merged PR #${pr.number} and deployed to GitHub Pages.`);
                  console.log(`[Pipeline] ${issue.identifier}: Deployed successfully`);
                }
              } else {
                console.log(`[Pipeline] ${issue.identifier}: PR merged but deploy not confirmed — staying at Done`);
                await postComment(issue.id, `**[PIPELINE]** PR #${pr.number} merged but GitHub Pages deploy not confirmed. Issue stays at Done — will retry.`);
              }
            } catch (mergeErr) {
              console.error(`[Pipeline] ${issue.identifier}: Merge failed: ${mergeErr.message}`);
              await postComment(issue.id, `**[PIPELINE]** Stall detector tried to merge PR #${pr.number} but failed: ${mergeErr.message}`);
            }
          } else {
            // No open PR — check if a PR was already merged (issue should be Deployed)
            // or if no PR exists at all (issue needs re-work)
            retriggeredRecently.set(issue.id, now);
            try {
              const mergedJson = execSync(
                `gh pr list -R ${GITHUB_REPO} --state merged --json number,title,headRefName --search "${issue.identifier}" 2>/dev/null`,
                { encoding: "utf-8" }
              );
              const mergedPrs = JSON.parse(mergedJson || "[]");
              const mergedPr = mergedPrs.find(
                (p) =>
                  p.title.includes(issue.identifier) ||
                  p.headRefName.toLowerCase().includes(issue.identifier.toLowerCase().replace("-", "-"))
              );

              if (mergedPr) {
                // PR was already merged — move to Deployed
                console.log(`[Pipeline] STALL DETECTED: ${issue.identifier} (Done) has merged PR #${mergedPr.number} but wasn't transitioned — moving to Deployed`);
                const states = await getStates(issue.team.id);
                const deployedState = findState(states, "Deployed");
                if (deployedState) {
                  markOurComment(issue.id);
                  await transitionIssue(issue.id, deployedState.id);
                  await postComment(issue.id, `**[PIPELINE]** PR #${mergedPr.number} was already merged. Auto-moving to Deployed (stall recovery).`);
                }
              } else {
                // No open or merged PR — move back to Todo so agent picks it up
                console.log(`[Pipeline] STALL DETECTED: ${issue.identifier} (Done) has no open or merged PR — moving to Todo for re-work`);
                const states = await getStates(issue.team.id);
                const todoState = findState(states, "Todo");
                if (todoState) {
                  markOurComment(issue.id);
                  await transitionIssue(issue.id, todoState.id);
                  console.log(`[Pipeline] ${issue.identifier}: Moved to Todo — Cyrus will pick it up automatically`);
                }
              }
            } catch (prCheckErr) {
              console.error(`[Pipeline] ${issue.identifier}: PR check error: ${prCheckErr.message}`);
            }
          }
        } catch (e) {
          console.error(`[Pipeline] ${issue.identifier}: Done stall check error: ${e.message}`);
        }
        continue;
      }

      // --- In Review issues: auto-move to Done if stalled ---
      if (stateName === "In Review") {
        if (now - lastUpdate < STALL_THRESHOLD) continue;

        console.log(`[Pipeline] STALL DETECTED: ${issue.identifier} (In Review) — stalled ${stalledMinutes}min, moving to Done`);
        const states = await getStates(issue.team.id);
        const doneState = findState(states, "Done");
        if (doneState) {
          markOurComment(issue.id);
          await transitionIssue(issue.id, doneState.id);
          console.log(`[Pipeline] ${issue.identifier}: Stall-moved In Review → Done`);
        }
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      // --- Todo / In Progress: reset to Todo to generate a real Linear webhook ---
      // Cyrus validates signatures on /webhook, so fake AgentSessionEvents are rejected.
      // The correct retrigger path is: set issue back to Todo → Linear sends a real
      // signed webhook → middleware forwards it → Cyrus starts a new session naturally.
      if (now - lastUpdate < STALL_THRESHOLD) continue;

      // Check serialization before resetting: skip if another issue is already In Progress
      try {
        const activeResult = await linearGQL(
          `query { issues(filter: { team: { key: { eq: "MAR" } }, state: { name: { in: ["In Progress"] } } }, first: 10) { nodes { id identifier } } }`,
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

      console.log(
        `[Pipeline] STALL DETECTED: ${issue.identifier} (${stateName}) — no activity for ${stalledMinutes}min, resetting to Todo`
      );

      const states = await getStates(issue.team.id);
      const todoState = findState(states, "Todo");
      if (todoState) {
        markOurComment(issue.id);
        await transitionIssue(issue.id, todoState.id);
        console.log(`[Pipeline] ${issue.identifier}: Reset to Todo — Linear webhook will retrigger Cyrus`);
      }
      retriggeredRecently.set(issue.id, now);
      await new Promise((r) => setTimeout(r, 3000));
    }
  } catch (e) {
    console.error(`[Pipeline] Stall detector error: ${e.message}`);
  }
}

// Start the stall detector
setInterval(checkForStalledIssues, STALL_CHECK_INTERVAL);
// Run once on startup after a short delay
setTimeout(checkForStalledIssues, 30_000);
console.log(`[Pipeline] Stall detector enabled (checks every ${STALL_CHECK_INTERVAL / 60_000}min, threshold ${STALL_THRESHOLD / 60_000}min)`);

// --- Server ---
const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "pipeline-ok", cyrus: CYRUS_PORT }));
    return;
  }

  // Collect body
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    // Forward everything to Cyrus first (non-blocking)
    const cyrusResult = forwardToCyrus(req.method, req.url, req.headers, body);

    // Process pipeline logic for webhook events
    if (req.url === "/webhook" && req.method === "POST") {
      try {
        const payload = JSON.parse(body);
        await handleWebhook(payload);
      } catch (e) {
        console.error(`[Pipeline] Error processing webhook: ${e.message}`);
      }
    }

    // Wait for Cyrus response and return it
    const result = await cyrusResult;
    if (req.url === "/webhook") {
      console.log(`[Pipeline] Cyrus response: ${result.status} — ${result.body?.substring(0, 200)}`);
    }
    res.writeHead(result.status || 200);
    res.end(result.body);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[Pipeline] Middleware running on http://127.0.0.1:${PORT}`);
  console.log(`[Pipeline] Forwarding to Cyrus on port ${CYRUS_PORT}`);
  console.log(`[Pipeline] Point ngrok to port ${PORT} instead of ${CYRUS_PORT}`);
  console.log(`[Pipeline] Stages: Todo → In Review (QA) → Done (Deploy) → Deployed`);
});
