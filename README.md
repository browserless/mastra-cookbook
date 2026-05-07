# Browserless × Mastra

Runnable TypeScript examples for the [Browserless](https://browserless.io) MCP server, using [`@mastra/mcp`](https://www.npmjs.com/package/@mastra/mcp).

The hosted endpoint at `https://mcp.browserless.io/mcp` exposes 10 tools auto-importable through Mastra's `MCPClient` — no partner package needed. Browser sessions are pinned by `Mcp-Session-Id`, so multi-turn `browserless_agent` flows preserve browser state across calls **without any extra configuration on the Mastra side**.

| | Stateless tools (8) | Stateful tools (2) |
|---|---|---|
| | `smartscraper`, `search`, `map`, `crawl`, `export`, `performance`, `function`, `download` | `agent`, `skill` |
| Use case | Single-shot scraping, research, data extraction | Multi-turn browser automation, multi-step browser flows with persistent browser state |

## Setup

```bash
npm install
export BROWSERLESS_TOKEN=<your-token>
export ANTHROPIC_API_KEY=<your-key>
```

Get a Browserless token at [account.browserless.io](https://account.browserless.io).

## Scripts

| Script | What it shows | Tier |
|---|---|---|
| `quickstart.ts` | Connect, list tools, call `browserless_smartscraper` directly, run a Mastra `Agent` with stateless tools | 1 (stateless) |
| `research_agent.ts` | Multi-step search → scrape → summarize using stateless tools | 1 (stateless) |
| `browser_agent.ts` | Multi-turn `browserless_agent`: navigate → snapshot → click → re-snapshot → extract | 2 (stateful) |

## Run

```bash
npm run quickstart
npm run research
npm run browser
```

## Quick connect

```ts
import { MCPClient } from "@mastra/mcp";

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

const tools = await mcp.listTools();
console.log(Object.keys(tools)); // 10 tools, namespaced as "browserless_browserless_*"
```

## Why no `_run_session()` workaround?

Unlike Python's `langchain-mcp-adapters` and `llama-index-tools-mcp` (which open a fresh MCP `ClientSession` per `tool.invoke()` call), Mastra's `@mastra/mcp` reuses one MCP session across tool calls by default. State is preserved automatically. See sister cookbooks for those frameworks: [`browserless/browserless-langchain`](https://github.com/browserless/browserless-langchain), [`browserless/browserless-llamaindex`](https://github.com/browserless/browserless-llamaindex).

## Links

- Hosted MCP server: [mcp.browserless.io](https://mcp.browserless.io)
- Mastra MCP package: [`@mastra/mcp`](https://github.com/mastra-ai/mastra/tree/main/packages/mcp)
- Mastra docs: [mastra.ai/docs](https://mastra.ai/docs)
