# DevPulse - Claude Code Instructions

## Rules

- Every `git push` MUST include updated README.md and README.zh-CN.md if any user-facing changes were made (new features, config changes, deployment changes, etc.)
- Use Chinese when communicating with the user
- Use Agent Skills instead of CLI tools for project control

## Project Overview

Personal developer hotspot content aggregator. pnpm monorepo with 3 packages:
- `packages/core` — Shared business logic (adapters, services, drizzle schema)
- `packages/web` — Vue 3 frontend + Fastify local server
- `packages/worker` — Cloudflare Worker (Hono + D1) for production

## Key Commands

```bash
pnpm build          # Build core + frontend
pnpm test           # Run all tests
pnpm start          # Start local server at http://localhost:3377

# Cloudflare deployment
cd packages/web && pnpm build
cd packages/worker && npx wrangler deploy
```

## Architecture

- Local: Fastify + better-sqlite3
- Production: Cloudflare Worker (Hono) + D1
- AI: Any OpenAI-compatible provider via AI_API_KEY/AI_BASE_URL/AI_MODEL
- Auth: Cloudflare Access (Zero Trust)
- Domain: devpulse.127.dev
