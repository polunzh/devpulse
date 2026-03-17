# DevPulse — 开发者热点聚合工具设计文档

## 概述

DevPulse 是一个个人用的开发者热点内容聚合工具。它从多个程序员常用站点（HackerNews、Reddit、Medium、V2ex 等）抓取热点内容，通过 AI 进行个性化推荐，帮助用户每天高效浏览感兴趣的热点，并记录已读状态避免重复阅读。

## 核心需求

- 添加和管理常用的开发者社区站点
- 定时或手动抓取各站点热点内容
- 基于站点原生热度 + AI 个性化推荐排序
- 标题+摘要列表，点击跳转原站阅读
- 已读记录，避免重复阅读
- 兴趣关键词手动配置 + 阅读历史自动学习

## 技术选型

| 层 | 选型 |
|---|------|
| 前端 | Vue 3 + Vite + TypeScript |
| 后端 | Fastify + TypeScript |
| 数据库 | better-sqlite3 |
| ORM | drizzle-orm |
| AI | @anthropic-ai/sdk (Claude API) |
| 定时任务 | node-cron |
| HTTP 抓取 | undici |
| RSS 解析 | rss-parser |
| 包管理 | pnpm workspace |

## 架构

```
用户 ──→ Agent Skill 命令 ──→ Fastify Server ──→ SQLite
              │                      │
              │                 ┌────┴────┐
              │              适配器调度器  AI 筛选器
              │                 │           │
              │           各站点适配器   Claude API
              │
         Vue Web UI ←──── Fastify API ←── SQLite
```

### 核心流程

1. 通过 Agent Skill 命令（如 `/devpulse-start`）启动 Fastify 服务
2. 调度器定时或手动触发各站点适配器抓取热点
3. 抓取结果存入 SQLite，同时调用 Claude API 做个性化评分
4. 用户通过 Web UI 浏览筛选后的内容列表
5. 点击标题跳转原站，同时标记已读写入 SQLite

### Monorepo 结构

```
devpulse/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── adapters/              # 站点适配器
│   │       │   ├── adapter.interface.ts
│   │       │   ├── hackernews.adapter.ts
│   │       │   ├── reddit.adapter.ts
│   │       │   ├── v2ex.adapter.ts
│   │       │   ├── medium.adapter.ts
│   │       │   └── index.ts
│   │       ├── services/
│   │       │   ├── fetcher.service.ts     # 调度抓取
│   │       │   ├── ai.service.ts          # Claude API 评分
│   │       │   └── interest.service.ts    # 兴趣学习
│   │       ├── db/
│   │       │   ├── schema.ts              # drizzle schema
│   │       │   └── migrations/
│   │       └── index.ts
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Feed.vue               # 首页列表
│       │   │   └── Settings.vue           # 设置页
│       │   ├── components/
│       │   ├── api/                       # API 调用封装
│       │   └── App.vue
│       ├── server/
│       │   ├── app.ts                     # Fastify 实例
│       │   └── routes/                    # API 路由
│       └── vite.config.ts
├── skills/                                # Agent Skills
│   ├── devpulse-start.md
│   ├── devpulse-stop.md
│   ├── devpulse-fetch.md
│   ├── devpulse-add-site.md
│   ├── devpulse-interests.md
│   └── devpulse-status.md
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 数据模型（SQLite，3NF）

### sites 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT (UUID) | PK | 主键 |
| name | TEXT | NOT NULL | 站点名 |
| adapter | TEXT | NOT NULL | 适配器标识 |
| enabled | BOOLEAN | NOT NULL DEFAULT 1 | 是否启用 |
| fetch_interval | INTEGER | NOT NULL DEFAULT 60 | 抓取间隔（分钟） |
| last_fetched_at | DATETIME | | 上次抓取时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |

### site_configs 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT (UUID) | PK | 主键 |
| site_id | TEXT | FK → sites.id, NOT NULL | |
| key | TEXT | NOT NULL | 配置键 |
| value | TEXT | NOT NULL | 配置值 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(site_id, key) | |

### posts 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT (UUID) | PK | 主键 |
| site_id | TEXT | FK → sites.id, NOT NULL | |
| external_id | TEXT | NOT NULL | 原站 ID |
| title | TEXT | NOT NULL | 标题 |
| summary | TEXT | | 摘要 |
| url | TEXT | NOT NULL | 原文链接 |
| author | TEXT | | 作者 |
| score | INTEGER | DEFAULT 0 | 原站热度分 |
| ai_score | REAL | | AI 推荐分（0-1） |
| ai_reason | TEXT | | AI 推荐理由 |
| published_at | DATETIME | | 发布时间 |
| fetched_at | DATETIME | NOT NULL | 抓取时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(site_id, external_id) | |

### tags 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT (UUID) | PK | 主键 |
| name | TEXT | UNIQUE, NOT NULL | 标签名 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |

### post_tags 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| post_id | TEXT | FK → posts.id, NOT NULL | |
| tag_id | TEXT | FK → tags.id, NOT NULL | |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| | | PK(post_id, tag_id) | |

### read_history 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT (UUID) | PK | 主键 |
| post_id | TEXT | FK → posts.id, UNIQUE, NOT NULL | |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 即阅读时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |

### interests 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT (UUID) | PK | 主键 |
| keyword | TEXT | UNIQUE, NOT NULL | 关键词 |
| weight | REAL | NOT NULL DEFAULT 1.0 | 权重 |
| source | TEXT | NOT NULL CHECK(source IN ('manual','learned')) | 来源 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | |

## 适配器系统

### 接口定义

```typescript
interface Adapter {
  name: string                              // "hackernews"
  displayName: string                       // "Hacker News"
  fetchPosts(config: SiteConfig): Promise<RawPost[]>
  configSchema?: ConfigSchema               // 可选：配置项 schema
}

interface RawPost {
  externalId: string
  title: string
  summary?: string
  url: string
  author?: string
  score: number
  publishedAt?: Date
}
```

### 初期支持站点

| 站点 | 抓取方式 | 说明 |
|------|---------|------|
| Hacker News | API | `https://hacker-news.firebaseio.com` |
| Reddit | JSON API | `{url}.json` 无需认证 |
| V2ex | API | `https://www.v2ex.com/api/v2` |
| Medium | RSS | Tag/Publication 的 RSS feed |

### 新增站点步骤

1. 新建 `xxx.adapter.ts` 实现 `Adapter` 接口
2. 在 `index.ts` 中注册

## AI 筛选系统

### 流程

```
抓取到新 posts → 批量发送给 Claude API → 返回评分+标签 → 写入数据库
```

### 调用策略

- 每次抓取后，将新增 posts 按批次（20 条/批）发送给 Claude
- Prompt 包含：用户兴趣关键词列表 + 权重 + 这批文章的标题和摘要
- Claude 返回每篇文章的：`ai_score`（0-1）、`tags`（标签数组）、`ai_reason`（推荐理由）

### Prompt 结构

```
你是一个开发者内容推荐助手。
用户的兴趣关键词：[Rust, AI, 系统设计, ...]
用户的兴趣权重：[Rust: 0.9, AI: 0.8, ...]

请对以下文章评分（0-1），提取标签，并给出推荐理由：
1. [标题] - [摘要] - [来源站点]
2. ...

返回 JSON 格式：
[{ "index": 1, "score": 0.85, "tags": ["AI", "LLM"], "reason": "..." }, ...]
```

### 兴趣学习

- 用户点击阅读 → 该文章的 tags 权重 +0.1
- 长期未点击某 tag 相关内容 → 权重缓慢衰减
- `source: "learned"` 的关键词从高频 tags 中自动生成
- 权重调整逻辑在 `packages/core/src/services/interest.service.ts`

### 排序公式

```
final_score = site_score_normalized * 0.4 + ai_score * 0.6
```

Web UI 列表按 `final_score` 降序展示，已读的放后面或隐藏。

## Agent Skills

| Skill | 作用 |
|-------|------|
| `/devpulse-start` | 启动 Fastify 服务（API + Web UI） |
| `/devpulse-stop` | 停止服务 |
| `/devpulse-fetch` | 手动触发抓取（可指定站点或全部） |
| `/devpulse-add-site` | 交互式添加新站点 |
| `/devpulse-interests` | 查看/编辑兴趣关键词 |
| `/devpulse-status` | 查看服务状态、各站点上次抓取时间等 |

Skills 通过调用 Fastify API 或直接操作 core 模块实现。

## Web UI

### 首页（Feed 列表）

- 顶部：站点筛选标签栏（全部 / HN / Reddit / ...）
- 列表项：标题 + 来源站点 + 热度 + AI 推荐理由 + 发布时间
- 点击标题 → 新标签页打开原站链接，同时标记已读
- 已读条目灰色显示，可一键切换"隐藏已读"
- 支持按 final_score / 时间排序

### 设置页

- 管理站点列表（启用/禁用/配置）
- 管理兴趣关键词和权重
- 抓取频率设置
