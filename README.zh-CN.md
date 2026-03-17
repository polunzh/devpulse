# DevPulse

[English](./README.md)

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

## 项目结构

```
devpulse/
├── packages/
│   ├── core/           # 适配器、服务、数据库 schema
│   └── web/            # Vue 前端 + Fastify API 服务
├── skills/             # Agent Skill 定义
└── docs/               # 设计文档和实施计划
```

## 运行测试

```bash
pnpm test
```

## 许可证

MIT
