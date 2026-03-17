# DevPulse

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

---

# DevPulse

个人开发者热点内容聚合工具。从 HackerNews、Reddit、V2EX、Medium 等站点收集热门内容，支持 AI 个性化推荐。

## 功能特性

- **多源聚合** — 插件化适配器，支持 HackerNews、Reddit、V2EX、Medium（易于扩展）
- **AI 推荐** — 通过 Claude API 根据你的兴趣对文章评分和打标签
- **已读追踪** — 标记已读，避免重复浏览
- **兴趣学习** — 手动配置关键词 + 根据阅读历史自动学习
- **Agent Skills** — 通过 Claude Code 斜杠命令控制（`/devpulse-start`、`/devpulse-fetch` 等）
- **Web UI** — 简洁的信息流列表，支持站点筛选、排序和设置管理

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 + Vite + TypeScript |
| 后端 | Fastify + TypeScript |
| 数据库 | SQLite (better-sqlite3 + drizzle-orm) |
| AI | Claude API (@anthropic-ai/sdk) |
| 包管理 | pnpm workspace (monorepo) |

## 快速开始

```bash
# 安装依赖
pnpm install

# 构建 core 包
pnpm --filter @devpulse/core build

# 启动服务（API + 定时抓取）
cd packages/web && pnpm start
# 服务运行在 http://localhost:3377

# （可选）启动前端开发服务器（热重载）
cd packages/web && pnpm dev
```

## Agent Skills 命令

| 命令 | 说明 |
|------|------|
| `/devpulse-start` | 启动服务 |
| `/devpulse-stop` | 停止服务 |
| `/devpulse-fetch` | 手动触发内容抓取 |
| `/devpulse-add-site` | 添加新站点 |
| `/devpulse-interests` | 管理兴趣关键词 |
| `/devpulse-status` | 查看服务和站点状态 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3377` | 服务端口 |
| `DB_PATH` | `./devpulse.db` | SQLite 数据库路径 |
| `ANTHROPIC_API_KEY` | — | Claude API 密钥（可选，不设置则跳过 AI 评分） |

## 运行测试

```bash
pnpm test
```

## 许可证

MIT
