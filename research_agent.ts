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
const statelessTools = Object.fromEntries(
  Object.entries(allTools).filter(
    ([k]) =>
      !k.endsWith("browserless_agent") && !k.endsWith("browserless_skill"),
  ),
);

const agent = new Agent({
  id: "browserless-research-agent",
  name: "BrowserlessResearchAgent",
  instructions:
    "You are a research assistant. Use browserless_search to find sources, then browserless_smartscraper to read them. Cite URLs in your output.",
  model: anthropic("claude-sonnet-4-6"),
  tools: statelessTools,
});

const prompt =
  "Research the current state of WebAssembly outside the browser. " +
  "Use browserless_search to find 3 recent authoritative articles, then use browserless_smartscraper " +
  "to read the most relevant one and summarize the key takeaways in 5 bullet points. " +
  "Cite the URL for each takeaway.";

const result = await agent.generate(prompt);
console.log(result.text);

await mcp.disconnect();
