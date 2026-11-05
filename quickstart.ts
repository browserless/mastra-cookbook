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
console.log(`Loaded ${Object.keys(allTools).length} tools:`);
for (const name of Object.keys(allTools)) console.log(`  - ${name}`);

// Direct call: smartscraper a deterministic URL — no LLM in the loop.
const smartscraperKey = Object.keys(allTools).find((k) =>
  k.endsWith("browserless_smartscraper"),
);
const smartscraper = smartscraperKey ? allTools[smartscraperKey] : undefined;
if (!smartscraper?.execute) {
  throw new Error("Browserless smartscraper tool is unavailable");
}
const scraped = await smartscraper.execute({
  url: "https://example.com",
  formats: ["markdown"],
}, {});
console.log("\n--- direct smartscraper call ---");
console.log(JSON.stringify(scraped).slice(0, 400));

// Stateless agent: filter out browserless_agent + browserless_skill.
const statelessTools = Object.fromEntries(
  Object.entries(allTools).filter(
    ([k]) =>
      !k.endsWith("browserless_agent") && !k.endsWith("browserless_skill"),
  ),
);

const agent = new Agent({
  id: "browserless-agent",
  name: "BrowserlessAgent",
  instructions:
    "You are a research assistant. Use the Browserless tools to scrape and summarize the web.",
  model: anthropic("claude-sonnet-4-6"),
  tools: statelessTools,
});

console.log("\n--- ReAct agent: top 5 HN headlines ---");
const result = await agent.generate(
  "Scrape https://news.ycombinator.com and list the top 5 headlines as a markdown bullet list.",
);
console.log(result.text);

await mcp.disconnect();
