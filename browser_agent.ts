/**
 * Tier 2 — multi-turn browser agent.
 *
 * Mastra's MCPClient reuses one MCP session across tool.execute() calls by
 * default, so multi-turn browserless_agent flows preserve browser state
 * (Mcp-Session-Id pinned by the load balancer to a single droplet) without
 * any extra configuration. Compare:
 *   - Python langchain-mcp-adapters → requires async with client.session(...)
 *   - Python llama-index-tools-mcp  → requires client._run_session() context manager
 *   - Mastra @mastra/mcp           → just works
 */
import { Agent } from "@mastra/core/agent";
import { MCPClient } from "@mastra/mcp";
import { anthropic } from "@ai-sdk/anthropic";

const mcp = new MCPClient({
  servers: {
    browserless: {
      url: new URL("https://mcp.browserless.io/mcp"),
      requestInit: {
        headers: { Authorization: `Bearer ${process.env.BROWSERLESS_TOKEN}` },
      },
    },
  },
});

const allTools = await mcp.listTools();
console.log(`Loaded ${Object.keys(allTools).length} tools`);

// --- direct multi-turn proof: state must survive across calls ---
const agentToolKey = Object.keys(allTools).find((k) =>
  k.endsWith("browserless_agent"),
)!;
const agentTool = allTools[agentToolKey];

await agentTool.execute({
  method: "goto",
  params: { url: "https://example.com" },
});
await agentTool.execute({ method: "snapshot" });
const result = await agentTool.execute({
  method: "text",
  params: { selector: "h1" },
});
console.log("multi-turn proof:", JSON.stringify(result).slice(0, 200));
if (!JSON.stringify(result).includes("Example Domain")) {
  throw new Error("Session state was not preserved between calls");
}

// --- full agent loop with all 10 tools ---
const agent = new Agent({
  name: "BrowserlessBrowserAgent",
  instructions:
    "You drive a real browser via the browserless_agent tool. " +
    "Always snapshot the page before extracting elements so you know what selectors are available. " +
    "Use selector references from the snapshot when calling text/click.",
  model: anthropic("claude-sonnet-4-6"),
  tools: allTools,
});

const out = await agent.generate(
  "Use browserless_agent to navigate to https://news.ycombinator.com, click the first story link, and report the title and first paragraph of that page.",
  { maxSteps: 15 },
);

console.log("\n--- full agent run ---");
console.log(out.text);

await mcp.disconnect();
