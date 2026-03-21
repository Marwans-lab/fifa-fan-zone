import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import https from "node:https";

// --- Config ---
const STITCH_API_KEY = process.env.STITCH_API_KEY;
const LINEAR_TOKEN = process.env.LINEAR_TOKEN;
const LINEAR_API = "https://api.linear.app/graphql";
const TEAM_ID = "9fb7888e-f60c-4316-b50e-fa1f4d782193"; // MAR team
const PROJECT_ID = "978662f2-57f8-44e3-9a5b-1e8059819bd8"; // FIFA Fan Zone
const POLL_INTERVAL = 60_000; // 60 seconds
const CACHE_FILE = new URL("./stitch-cache.json", import.meta.url).pathname;

if (!STITCH_API_KEY) {
  console.error("[Stitch Watcher] ERROR: STITCH_API_KEY env var is required");
  process.exit(1);
}
if (!LINEAR_TOKEN) {
  console.error("[Stitch Watcher] ERROR: LINEAR_TOKEN env var is required");
  process.exit(1);
}

// --- Linear helpers ---
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

async function createLinearIssue(title, description) {
  // Find the "Frontend" label ID
  const labelsResult = await linearGQL(
    `query($teamId: String!) {
      team(id: $teamId) {
        labels { nodes { id name } }
      }
    }`,
    { teamId: TEAM_ID }
  );
  const frontendLabel = labelsResult.data.team.labels.nodes.find(
    (l) => l.name === "Frontend"
  );

  // Find "Todo" state ID
  const statesResult = await linearGQL(
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name } }
      }
    }`,
    { teamId: TEAM_ID }
  );
  const todoState = statesResult.data.team.states.nodes.find(
    (s) => s.name === "Todo"
  );

  const input = {
    teamId: TEAM_ID,
    projectId: PROJECT_ID,
    title,
    description,
    stateId: todoState?.id,
    labelIds: frontendLabel ? [frontendLabel.id] : [],
  };

  const result = await linearGQL(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`,
    { input }
  );

  const issue = result.data?.issueCreate?.issue;
  if (issue) {
    console.log(
      `[Stitch Watcher] Created ${issue.identifier}: ${title} → ${issue.url}`
    );
  }
  return issue;
}

// --- MCP client for Stitch proxy ---
class StitchMCPClient {
  constructor() {
    this.proc = null;
    this.reqId = 0;
    this.pending = new Map();
    this.buffer = "";
  }

  async connect() {
    this.proc = spawn("npx", ["-y", "@_davideast/stitch-mcp", "proxy"], {
      env: { ...process.env, STITCH_API_KEY },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.proc.stdout.on("data", (chunk) => {
      this.buffer += chunk.toString();
      // MCP uses JSON-RPC over stdio, each message is a line
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id != null && this.pending.has(msg.id)) {
            const { resolve } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            resolve(msg);
          }
        } catch {
          // not JSON, ignore
        }
      }
    });

    this.proc.stderr.on("data", (chunk) => {
      const msg = chunk.toString().trim();
      if (msg) console.error(`[Stitch MCP] ${msg}`);
    });

    this.proc.on("exit", (code) => {
      console.log(`[Stitch Watcher] MCP proxy exited with code ${code}`);
    });

    // Initialize MCP connection
    await this.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "stitch-watcher", version: "1.0.0" },
    });
    // Send initialized notification
    this.notify("notifications/initialized", {});

    console.log("[Stitch Watcher] Connected to Stitch MCP proxy");
  }

  call(method, params) {
    const id = ++this.reqId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });
      this.proc.stdin.write(msg + "\n");
      // Timeout after 30s
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`MCP call "${method}" timed out`));
        }
      }, 30_000);
    });
  }

  notify(method, params) {
    const msg = JSON.stringify({ jsonrpc: "2.0", method, params });
    this.proc.stdin.write(msg + "\n");
  }

  async callTool(name, args = {}) {
    const result = await this.call("tools/call", { name, arguments: args });
    if (result.error) throw new Error(result.error.message);
    return result.result;
  }

  async listTools() {
    const result = await this.call("tools/list", {});
    return result.result?.tools || [];
  }

  kill() {
    if (this.proc) this.proc.kill();
  }
}

// --- Cache ---
function loadCache() {
  if (existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

// --- Main polling loop ---
async function main() {
  const client = new StitchMCPClient();
  await client.connect();

  // Discover available tools
  const tools = await client.listTools();
  console.log(
    `[Stitch Watcher] Available tools: ${tools.map((t) => t.name).join(", ")}`
  );

  const hasListProjects = tools.some((t) => t.name === "list_projects");
  const hasListScreens = tools.some((t) => t.name === "list_screens");
  const hasGetScreen = tools.some((t) => t.name === "get_screen");

  if (!hasListProjects || !hasListScreens || !hasGetScreen) {
    console.error(
      "[Stitch Watcher] Missing required tools (list_projects, list_screens, get_screen). Available:",
      tools.map((t) => t.name)
    );
    client.kill();
    process.exit(1);
  }

  let cache = loadCache();
  console.log(
    `[Stitch Watcher] Loaded cache with ${Object.keys(cache).length} screens`
  );
  console.log(
    `[Stitch Watcher] Polling every ${POLL_INTERVAL / 1000}s for design changes`
  );

  async function poll() {
    try {
      // Step 1: List all projects
      const projectsResult = await client.callTool("list_projects");
      const projectsText =
        projectsResult?.content?.[0]?.text || JSON.stringify(projectsResult);

      let projects = [];
      try {
        const parsed = JSON.parse(projectsText);
        projects = Array.isArray(parsed) ? parsed : parsed.projects || [];
      } catch {
        console.log(
          `[Stitch Watcher] Could not parse projects, raw: ${projectsText.slice(0, 200)}`
        );
        return;
      }

      if (projects.length === 0) {
        console.log("[Stitch Watcher] No projects found in Stitch");
        return;
      }

      // Step 2: For each project, list its screens
      let allScreens = [];
      for (const proj of projects) {
        const projectId = proj.id || proj.projectId;
        const projectName = proj.name || proj.title || projectId;
        try {
          const screensResult = await client.callTool("list_screens", {
            projectId,
          });
          const screensText =
            screensResult?.content?.[0]?.text ||
            JSON.stringify(screensResult);
          let screens = [];
          try {
            const parsed = JSON.parse(screensText);
            screens = Array.isArray(parsed) ? parsed : parsed.screens || [];
          } catch {
            console.log(
              `[Stitch Watcher] Could not parse screens for ${projectName}: ${screensText.slice(0, 200)}`
            );
            continue;
          }
          for (const s of screens) {
            allScreens.push({
              projectId,
              projectName,
              screenId: s.id || s.screenId,
              screenName: s.name || s.title || s.id,
            });
          }
        } catch (e) {
          console.error(
            `[Stitch Watcher] Error listing screens for ${projectName}: ${e.message}`
          );
        }
      }

      if (allScreens.length === 0) {
        console.log("[Stitch Watcher] No screens found across all projects");
        return;
      }

      console.log(
        `[Stitch Watcher] Found ${allScreens.length} screens, checking for changes...`
      );

      // Step 3: Get each screen's content and compare hashes
      for (const screen of allScreens) {
        try {
          const screenResult = await client.callTool("get_screen", {
            projectId: screen.projectId,
            screenId: screen.screenId,
          });
          const content =
            screenResult?.content?.[0]?.text || JSON.stringify(screenResult);
          const hash = hashContent(content);
          const cacheKey = `${screen.projectId}:${screen.screenId}`;
          const prevHash = cache[cacheKey]?.hash;

          if (prevHash && prevHash !== hash) {
            // Screen changed — create a Linear issue
            console.log(
              `[Stitch Watcher] CHANGE DETECTED: ${screen.screenName} (${prevHash} → ${hash})`
            );

            const title = `[Stitch: ${screen.screenName}] Update ${screen.screenName} screen`;
            const description = [
              `## Stitch Design Update`,
              ``,
              `A design change was detected in Stitch.`,
              ``,
              `- **Project**: ${screen.projectName}`,
              `- **Screen**: ${screen.screenName}`,
              `- **Screen ID**: ${screen.screenId}`,
              ``,
              `## Instructions`,
              ``,
              `1. Pull the latest design from Stitch using \`get_screen\` tool with projectId: \`${screen.projectId}\` and screenId: \`${screen.screenId}\``,
              `2. Update the corresponding React component to match the new design exactly`,
              `3. Follow the Stitch Design Integration guidelines in CLAUDE.md`,
              ``,
              `## Done When`,
              `- Component matches the Stitch design pixel-for-pixel`,
              `- \`tsc && vite build\` passes with zero errors`,
              `- No visual regressions on mobile viewport`,
            ].join("\n");

            await createLinearIssue(title, description);
          } else if (!prevHash) {
            console.log(
              `[Stitch Watcher] New screen indexed: ${screen.screenName}`
            );
          }

          cache[cacheKey] = {
            hash,
            screenName: screen.screenName,
            projectName: screen.projectName,
            lastChecked: new Date().toISOString(),
          };
        } catch (e) {
          console.error(
            `[Stitch Watcher] Error checking screen ${screen.screenName}: ${e.message}`
          );
        }
      }

      saveCache(cache);
    } catch (e) {
      console.error(`[Stitch Watcher] Poll error: ${e.message}`);
    }
  }

  // Initial poll
  await poll();

  // Schedule recurring polls
  setInterval(poll, POLL_INTERVAL);
}

main().catch((e) => {
  console.error(`[Stitch Watcher] Fatal error: ${e.message}`);
  process.exit(1);
});
