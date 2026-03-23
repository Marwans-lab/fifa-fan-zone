import http from "node:http";
import https from "node:https";
import { execSync } from "node:child_process";

// --- Config ---
const PORT = 3457;
const CYRUS_PORT = 3456;
const LINEAR_API = "https://api.linear.app/graphql";
const LINEAR_TOKEN = process.env.LINEAR_TOKEN;
const GITHUB_REPO = "Marwans-lab/fifa-fan-zone";
const CYRUS_API_KEY = process.env.CYRUS_API_KEY || "";

if (!LINEAR_TOKEN) {
  console.error("ERROR: LINEAR_TOKEN env var is required");
  process.exit(1);
}

// --- Helpers ---
function linearGQL(query, variables) {
  const body = JSON.stringify({ query, variables });
  return new Promise((resolve, reject) => {
    const req = https.request(
      LINEAR_API,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: LINEAR_TOKEN,
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
  const result = await linearGQL(
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body }
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

// --- Pipeline logic ---
async function handleWebhook(payload) {
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

  // Stage 2: In Review → trigger QA
  if (newState === "In Review") {
    if (recentComments.has(issueId)) return;
    markOurComment(issueId);

    const labelInfo = labels.includes("Frontend")
      ? "Frontend"
      : labels.includes("Backend")
        ? "Backend"
        : "General";

    console.log(`[Pipeline] ${issueIdentifier}: Triggering QA review`);
    await postComment(
      issueId,
      `@Claude **[QA REVIEW]** Review this ${labelInfo} implementation.\n\nCheck:\n- All acceptance criteria from the issue description are met\n- If the issue has a Figma link, use Figma_ExportImage to compare the design against the implementation — it must match pixel-for-pixel\n- Code quality and no regressions\n- No hardcoded values, no leftover debug code\n- Edge cases handled\n\nIf everything passes, move to **Done**.\nIf anything fails, move back to **Todo** and explain exactly what needs fixing.`
    );
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
        console.log(`[Pipeline] ${issueIdentifier}: No PR found, skipping deploy`);
        await postComment(
          issueId,
          `**[DEPLOY SKIPPED]** No open PR found for ${issueIdentifier}. Issue stays at Done.`
        );
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

  // Stage 1 (retry): Todo → if issue was bounced back by QA, it will be
  // picked up by Cyrus automatically since it's re-assigned/delegated
  if (newState === "Todo") {
    // Check if this was bounced back from QA (has a previous state of In Review)
    const prevStateName = payload.updatedFrom?.stateId;
    if (prevStateName) {
      try {
        const states = await getStates(teamId);
        const prevState = states.find((s) => s.id === prevStateName);
        if (prevState && prevState.name === "In Review") {
          if (recentComments.has(issueId)) return;
          markOurComment(issueId);

          const labelInfo = labels.includes("Frontend")
            ? "Frontend"
            : labels.includes("Backend")
              ? "Backend"
              : "General";

          console.log(
            `[Pipeline] ${issueIdentifier}: QA bounced back, re-triggering ${labelInfo} dev`
          );
          await postComment(
            issueId,
            `@Claude **[QA BOUNCE]** This issue was sent back by QA. Read the QA feedback in the previous comments and fix the issues. You are the ${labelInfo} specialist — address every point raised by QA, then move back to **In Review**.`
          );
        }
      } catch (e) {
        console.error(`[Pipeline] Error checking previous state: ${e.message}`);
      }
    }
  }
}

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
