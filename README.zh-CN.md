# DevPulse

[![CI](https://github.com/polunzh/devpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/polunzh/devpulse/actions/workflows/ci.yml)
![Coverage](https://github.com/polunzh/devpulse/blob/master/.github/badges/coverage.svg?raw=true)
[![Live Demo](https://img.shields.io/badge/demo-live-f97316)](https://polunzh.github.io/devpulse/)

[English](./README.md) | [在线演示](https://polunzh.github.io/devpulse/)

个人开发者热点内容聚合工具。从 HackerNews、Reddit、V2EX、Medium、Discourse 论坛等站点收集热门内容，支持 AI 个性化推荐。

## 功能特性

- **多源聚合** — 插件化适配器，支持 HackerNews、Reddit、V2EX、Medium、Discourse（易于扩展）
- **AI 推荐** — 支持多种 AI 提供商（DeepSeek、Kimi、Qwen、MiniMax、OpenAI、Claude），根据你的兴趣对文章评分和打标签
- **已读追踪** — 标记已读，避免重复浏览
- **兴趣学习** — 手动配置关键词 + 根据阅读历史自动学习
- **Agent Skills** — 通过 Claude Code 斜杠命令控制（`/devpulse-start`、`/devpulse-fetch` 等）
- **Web UI** — 简洁的信息流列表，支持站点筛选、排序和设置管理
- **筛选持久化** — 筛选条件同步到 URL 参数和 localStorage，可分享、可收藏
- **已读动画隐藏** — 开启"隐藏已读"后，已读文章平滑滑出消失
- **Open Graph 元标签** — 配置社交平台分享预览
- **Cloudflare 部署** — Worker + D1 + Pages，单域名，Cloudflare Access 保护

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 + Vite + TypeScript |
| 后端（本地） | Fastify + TypeScript |
| 后端（云端） | Cloudflare Workers + Hono |
| 数据库（本地） | SQLite (better-sqlite3 + drizzle-orm) |
| 数据库（云端） | Cloudflare D1 |
| AI | 任意 OpenAI 兼容 API（DeepSeek、Kimi、Qwen 等） |
| 包管理 | pnpm workspace (monorepo) |

## 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 构建并启动
pnpm build
pnpm start
# 服务运行在 http://localhost:3377
```

### 部署到 Cloudflare

```bash
# 创建 D1 数据库
cd packages/worker
npx wrangler d1 create devpulse-db
# 将返回的 database_id 填入 wrangler.toml

# 运行迁移
npx wrangler d1 execute devpulse-db --remote --file=migrations/0001_init.sql

# 设置 AI 提供商（以 DeepSeek 为例）
npx wrangler secret put AI_API_KEY
npx wrangler secret put AI_BASE_URL    # https://api.deepseek.com/v1
npx wrangler secret put AI_MODEL       # deepseek-chat

# 构建前端并部署
cd ../web && pnpm build
cd ../worker && npx wrangler deploy
```

## AI 提供商

通过 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL` 环境变量配置。

| 提供商 | Base URL | 模型 |
|--------|----------|------|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Kimi | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-turbo` |
| MiniMax | `https://api.minimax.chat/v1` | `MiniMax-Text-01` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Claude | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |

## Agent Skills 命令

| 命令 | 说明 |
|------|------|
| `/devpulse-start` | 启动本地服务 |
| `/devpulse-stop` | 停止本地服务 |
| `/devpulse-fetch` | 手动触发内容抓取 |
| `/devpulse-add-site` | 添加新站点 |
| `/devpulse-interests` | 管理兴趣关键词 |
| `/devpulse-status` | 查看服务和站点状态 |

## 环境变量

### 本地 (packages/web)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3377` | 服务端口 |
| `DB_PATH` | `./devpulse.db` | SQLite 数据库路径 |
| `AI_API_KEY` | — | AI 提供商 API Key |
| `AI_BASE_URL` | — | AI 提供商 Base URL |
| `AI_MODEL` | — | AI 模型名称 |

### Cloudflare (packages/worker)

| 变量 | 说明 |
|------|------|
| `AI_API_KEY` | AI 提供商 API Key（通过 `wrangler secret put` 设置） |
| `AI_BASE_URL` | AI 提供商 Base URL |
| `AI_MODEL` | AI 模型名称 |

## 项目结构

```
devpulse/
├── packages/
│   ├── core/           # 适配器、服务、数据库 schema
│   ├── web/            # Vue 前端 + Fastify 本地服务
│   └── worker/         # Cloudflare Worker（Hono + D1）
├── skills/             # Agent Skill 定义
└── docs/               # 设计文档和实施计划
```

## 运行测试

```bash
pnpm test
```

## 许可证

MIT
