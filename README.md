# DevPulse

[中文文档](./README.zh-CN.md)

A personal developer hotspot content aggregator. Collects trending posts from HackerNews, Reddit, V2EX, Medium and more, with AI-powered personalized recommendations.

## Features

- **Multi-source aggregation** — Plugin-based adapters for HackerNews, Reddit, V2EX, Medium (easily extensible)
- **AI recommendations** — Claude API scores and tags posts based on your interests
- **Read tracking** — Marks posts as read to avoid duplicate browsing
- **Interest learning** — Manual keyword config + automatic learning from reading history
- **Agent Skills** — Control via Claude Code slash commands (`/devpulse-start`, `/devpulse-fetch`, etc.)
- **Web UI** — Clean feed list with site filtering, sorting, and settings management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite + TypeScript |
| Backend | Fastify + TypeScript |
| Database | SQLite (better-sqlite3 + drizzle-orm) |
| AI | Claude API (@anthropic-ai/sdk) |
| Package Manager | pnpm workspace (monorepo) |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build core package
pnpm --filter @devpulse/core build

# Start server (API + scheduled fetching)
cd packages/web && pnpm start
# Server runs at http://localhost:3377

# (Optional) Start frontend dev server with hot reload
cd packages/web && pnpm dev
```

## Agent Skills

| Command | Description |
|---------|-------------|
| `/devpulse-start` | Start the server |
| `/devpulse-stop` | Stop the server |
| `/devpulse-fetch` | Manually trigger content fetch |
| `/devpulse-add-site` | Add a new site |
| `/devpulse-interests` | Manage interest keywords |
| `/devpulse-status` | Check server and site status |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3377` | Server port |
| `DB_PATH` | `./devpulse.db` | SQLite database path |
| `ANTHROPIC_API_KEY` | — | Claude API key (optional, AI scoring disabled without it) |

## Project Structure

```
devpulse/
├── packages/
│   ├── core/           # Adapters, services, database schema
│   └── web/            # Vue frontend + Fastify API server
├── skills/             # Agent Skill definitions
└── docs/               # Design spec and implementation plan
```

## Running Tests

```bash
pnpm test
```

## License

MIT

