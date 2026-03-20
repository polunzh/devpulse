# DevPulse

[![CI](https://github.com/polunzh/devpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/polunzh/devpulse/actions/workflows/ci.yml)
![Coverage](https://github.com/polunzh/devpulse/blob/master/.github/badges/coverage.svg?raw=true)
[![Live Demo](https://img.shields.io/badge/demo-live-f97316)](https://polunzh.github.io/devpulse/)

[中文文档](./README.zh-CN.md) | [Live Demo](https://polunzh.github.io/devpulse/)

A personal developer hotspot content aggregator. Collects trending posts from HackerNews, Reddit, V2EX, Medium, Discourse forums and more, with AI-powered personalized recommendations.

## Features

- **Multi-source aggregation** — Plugin-based adapters for HackerNews, Reddit, V2EX, Medium, Discourse (easily extensible)
- **AI recommendations** — Supports multiple AI providers (DeepSeek, Kimi, Qwen, MiniMax, OpenAI, Claude) for scoring and tagging posts based on your interests
- **Read tracking** — Marks posts as read to avoid duplicate browsing
- **Interest learning** — Manual keyword config + automatic learning from reading history
- **Agent Skills** — Control via Claude Code slash commands (`/devpulse-start`, `/devpulse-fetch`, etc.)
- **Web UI** — Clean feed list with site filtering, sorting, and settings management
- **Filter persistence** — Filters saved to URL query params and localStorage, shareable and bookmark-friendly
- **Animated read hiding** — Read posts smoothly animate out when "Hide read" is enabled
- **Cloudflare deployment** — Worker + D1 + Pages, single domain, protected by Cloudflare Access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite + TypeScript |
| Backend (local) | Fastify + TypeScript |
| Backend (cloud) | Cloudflare Workers + Hono |
| Database (local) | SQLite (better-sqlite3 + drizzle-orm) |
| Database (cloud) | Cloudflare D1 |
| AI | Any OpenAI-compatible API (DeepSeek, Kimi, Qwen, etc.) |
| Package Manager | pnpm workspace (monorepo) |

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Build and start
pnpm build
pnpm start
# Server runs at http://localhost:3377
```

### Deploy to Cloudflare

```bash
# Create D1 database
cd packages/worker
npx wrangler d1 create devpulse-db
# Update database_id in wrangler.toml

# Run migration
npx wrangler d1 execute devpulse-db --remote --file=migrations/0001_init.sql

# Set AI provider (e.g. DeepSeek)
npx wrangler secret put AI_API_KEY
npx wrangler secret put AI_BASE_URL    # https://api.deepseek.com/v1
npx wrangler secret put AI_MODEL       # deepseek-chat

# Build frontend and deploy
cd ../web && pnpm build
cd ../worker && npx wrangler deploy
```

## AI Providers

Configure via `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` environment variables.

| Provider | Base URL | Model |
|----------|----------|-------|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Kimi | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-turbo` |
| MiniMax | `https://api.minimax.chat/v1` | `MiniMax-Text-01` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Claude | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |

## Agent Skills

| Command | Description |
|---------|-------------|
| `/devpulse-start` | Start the local server |
| `/devpulse-stop` | Stop the local server |
| `/devpulse-fetch` | Manually trigger content fetch |
| `/devpulse-add-site` | Add a new site |
| `/devpulse-interests` | Manage interest keywords |
| `/devpulse-status` | Check server and site status |

## Environment Variables

### Local (packages/web)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3377` | Server port |
| `DB_PATH` | `./devpulse.db` | SQLite database path |
| `AI_API_KEY` | — | AI provider API key |
| `AI_BASE_URL` | — | AI provider base URL |
| `AI_MODEL` | — | AI model name |

### Cloudflare (packages/worker)

| Variable | Description |
|----------|-------------|
| `AI_API_KEY` | AI provider API key (set via `wrangler secret put`) |
| `AI_BASE_URL` | AI provider base URL |
| `AI_MODEL` | AI model name |

## Project Structure

```
devpulse/
├── packages/
│   ├── core/           # Adapters, services, database schema
│   ├── web/            # Vue frontend + Fastify local server
│   └── worker/         # Cloudflare Worker (Hono + D1)
├── skills/             # Agent Skill definitions
└── docs/               # Design spec and implementation plan
```

## Running Tests

```bash
pnpm test
```

## License

MIT
