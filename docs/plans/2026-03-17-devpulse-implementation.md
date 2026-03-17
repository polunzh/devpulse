# DevPulse Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a developer hotspot content aggregator with plugin-based adapters, AI recommendations, and a Vue web UI, controlled via Agent Skills.

**Architecture:** pnpm monorepo with two packages — `core` (adapters, services, database) and `web` (Vue 3 frontend + Fastify API server). Agent Skills in `skills/` directory invoke the server or core modules directly.

**Tech Stack:** TypeScript, Vue 3 + Vite, Fastify, drizzle-orm + better-sqlite3, @anthropic-ai/sdk, node-cron, undici, rss-parser, pnpm workspace.

**Spec:** `docs/specs/2026-03-17-devpulse-design.md`

---

## File Structure

```
devpulse/
├── package.json                          # Root workspace config
├── pnpm-workspace.yaml                   # pnpm workspace definition
├── tsconfig.json                         # Root TS config (path aliases)
├── tsconfig.base.json                    # Shared TS compiler options
├── .gitignore
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts                  # Public API barrel export
│   │   │   ├── db/
│   │   │   │   ├── schema.ts             # Drizzle table definitions (all 7 tables)
│   │   │   │   ├── connection.ts         # SQLite connection factory
│   │   │   │   └── migrate.ts            # Run migrations on startup
│   │   │   ├── adapters/
│   │   │   │   ├── adapter.interface.ts  # Adapter, RawPost, SiteConfig, ConfigSchema types
│   │   │   │   ├── hackernews.adapter.ts # HN Firebase API adapter
│   │   │   │   ├── reddit.adapter.ts     # Reddit JSON API adapter
│   │   │   │   ├── v2ex.adapter.ts       # V2ex API adapter
│   │   │   │   ├── medium.adapter.ts     # Medium RSS adapter
│   │   │   │   └── index.ts             # Adapter registry (name → instance map)
│   │   │   └── services/
│   │   │       ├── fetcher.service.ts    # Orchestrates fetch: calls adapters, dedupes, saves
│   │   │       ├── ai.service.ts         # Claude API: batch scoring + tag extraction
│   │   │       ├── interest.service.ts   # CRUD interests, weight boost/decay, learned keywords
│   │   │       ├── post.service.ts       # Query posts with sorting, filtering, read status
│   │   │       └── site.service.ts       # CRUD sites + site_configs
│   │   └── tests/
│   │       ├── db/
│   │       │   └── schema.test.ts        # Schema creates tables, constraints work
│   │       ├── adapters/
│   │       │   ├── hackernews.test.ts    # HN adapter parses API response
│   │       │   ├── reddit.test.ts
│   │       │   ├── v2ex.test.ts
│   │       │   └── medium.test.ts
│   │       └── services/
│   │           ├── fetcher.test.ts       # Fetcher orchestration, dedup
│   │           ├── ai.test.ts            # AI scoring with mocked Claude
│   │           ├── interest.test.ts      # Weight boost, decay, learned keywords
│   │           ├── post.test.ts          # Query, sort, filter, read marking
│   │           └── site.test.ts          # Site CRUD
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── server/
│       │   ├── app.ts                    # Fastify instance + plugin registration
│       │   ├── start.ts                  # Entry point: start server + cron scheduler
│       │   └── routes/
│       │       ├── posts.routes.ts       # GET /api/posts, POST /api/posts/:id/read
│       │       ├── sites.routes.ts       # CRUD /api/sites
│       │       ├── interests.routes.ts   # CRUD /api/interests
│       │       └── fetch.routes.ts       # POST /api/fetch (manual trigger)
│       └── src/
│           ├── App.vue                   # Router setup
│           ├── main.ts                   # Vue app entry
│           ├── router.ts                 # Vue Router: / and /settings
│           ├── api/
│           │   └── client.ts             # fetch wrapper for all API calls
│           ├── pages/
│           │   ├── Feed.vue              # Main feed list page
│           │   └── Settings.vue          # Site + interest management
│           └── components/
│               ├── PostItem.vue          # Single post row in feed
│               ├── SiteFilter.vue        # Site filter tag bar
│               └── InterestTag.vue       # Interest keyword tag with weight
├── skills/
│   ├── devpulse-start.md
│   ├── devpulse-stop.md
│   ├── devpulse-fetch.md
│   ├── devpulse-add-site.md
│   ├── devpulse-interests.md
│   └── devpulse-status.md
└── docs/
    ├── specs/
    │   └── 2026-03-17-devpulse-design.md
    └── plans/
        └── 2026-03-17-devpulse-implementation.md
```

---

## Task 1: Project Scaffolding

**Goal:** Set up pnpm monorepo with both packages, TypeScript config, and all dependencies.

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/tsconfig.node.json`
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/index.html`
- Create: `packages/web/src/main.ts`
- Create: `packages/web/src/App.vue`

**Dependencies (independent, no prior tasks):** None

- [ ] **Step 1: Create root workspace files**

`package.json`:
```json
{
  "name": "devpulse",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @devpulse/web dev",
    "build": "pnpm --filter @devpulse/core build && pnpm --filter @devpulse/web build",
    "test": "pnpm --filter @devpulse/core test",
    "start": "pnpm --filter @devpulse/web start"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

`.gitignore`:
```
node_modules/
dist/
*.db
*.db-journal
.env
```

- [ ] **Step 2: Create shared TypeScript config**

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

`tsconfig.json` (root):
```json
{
  "references": [
    { "path": "packages/core" },
    { "path": "packages/web" }
  ],
  "files": []
}
```

- [ ] **Step 3: Create core package**

`packages/core/package.json`:
```json
{
  "name": "@devpulse/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.39.0",
    "@anthropic-ai/sdk": "^0.52.0",
    "undici": "^7.0.0",
    "rss-parser": "^3.13.0",
    "node-cron": "^3.0.3",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0",
    "drizzle-kit": "^0.30.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

`packages/core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/core/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

`packages/core/src/index.ts`:
```typescript
export * from './db/schema.js';
export * from './db/connection.js';
export * from './adapters/adapter.interface.js';
export * from './adapters/index.js';
```

- [ ] **Step 4: Create web package**

`packages/web/package.json`:
```json
{
  "name": "@devpulse/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "start": "tsx server/start.ts"
  },
  "dependencies": {
    "@devpulse/core": "workspace:*",
    "fastify": "^5.0.0",
    "@fastify/static": "^8.0.0",
    "@fastify/cors": "^10.0.0",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vite": "^6.0.0",
    "vue-tsc": "^2.2.0"
  }
}
```

`packages/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.vue"],
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

`packages/web/tsconfig.node.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist-server"
  },
  "include": ["server/**/*", "vite.config.ts"]
}
```

`packages/web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3377',
    },
  },
});
```

`packages/web/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevPulse</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

`packages/web/src/main.ts`:
```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

createApp(App).use(router).mount('#app');
```

`packages/web/src/App.vue`:
```vue
<template>
  <router-view />
</template>
```

`packages/web/src/router.ts`:
```typescript
import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/Feed.vue') },
    { path: '/settings', component: () => import('./pages/Settings.vue') },
  ],
});
```

- [ ] **Step 5: Install dependencies and verify**

Run: `pnpm install`
Expected: All packages resolved, no errors.

Run: `cd packages/core && pnpm tsc --noEmit`
Expected: No type errors (only index.ts exists, exports will fail — that's OK, fixed in Task 2).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold pnpm monorepo with core and web packages"
```

---

## Task 2: Database Schema & Connection

**Goal:** Define all 7 tables with drizzle-orm, create connection factory, and verify with tests.

**Files:**
- Create: `packages/core/src/db/schema.ts`
- Create: `packages/core/src/db/connection.ts`
- Create: `packages/core/tests/db/schema.test.ts`

**Dependencies:** Task 1

- [ ] **Step 1: Write schema tests**

`packages/core/tests/db/schema.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/db/schema.js';

function createTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  // Run table creation SQL — we'll use drizzle-kit push in prod,
  // but for tests we create tables directly
  sqlite.exec(`
    CREATE TABLE sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      adapter TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      fetch_interval INTEGER NOT NULL DEFAULT 60,
      last_fetched_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE site_configs (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(site_id, key)
    );
    CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id),
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      url TEXT NOT NULL,
      author TEXT,
      score INTEGER DEFAULT 0,
      ai_score REAL,
      ai_reason TEXT,
      published_at TEXT,
      fetched_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(site_id, external_id)
    );
    CREATE TABLE tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE post_tags (
      post_id TEXT NOT NULL REFERENCES posts(id),
      tag_id TEXT NOT NULL REFERENCES tags(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY(post_id, tag_id)
    );
    CREATE TABLE read_history (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL UNIQUE REFERENCES posts(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE interests (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL UNIQUE,
      weight REAL NOT NULL DEFAULT 1.0,
      source TEXT NOT NULL CHECK(source IN ('manual','learned')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return { db, sqlite };
}

describe('Database Schema', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: Database.Database;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
  });

  afterEach(() => {
    sqlite.close();
  });

  it('should insert and query a site', () => {
    db.insert(schema.sites).values({
      id: 'site-1',
      name: 'Hacker News',
      adapter: 'hackernews',
    }).run();

    const rows = db.select().from(schema.sites).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Hacker News');
    expect(rows[0].enabled).toBe(1);
    expect(rows[0].fetchInterval).toBe(60);
  });

  it('should enforce unique site_id+external_id on posts', () => {
    db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
    db.insert(schema.posts).values({
      id: 'p1', siteId: 's1', externalId: '123', title: 'T', url: 'http://x', fetchedAt: new Date().toISOString(),
    }).run();

    expect(() =>
      db.insert(schema.posts).values({
        id: 'p2', siteId: 's1', externalId: '123', title: 'T2', url: 'http://y', fetchedAt: new Date().toISOString(),
      }).run()
    ).toThrow();
  });

  it('should enforce interests source check constraint', () => {
    expect(() =>
      db.insert(schema.interests).values({
        id: 'i1', keyword: 'Rust', weight: 1.0, source: 'invalid' as any,
      }).run()
    ).toThrow();
  });

  it('should insert and query read_history', () => {
    db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
    db.insert(schema.posts).values({
      id: 'p1', siteId: 's1', externalId: '1', title: 'T', url: 'http://x', fetchedAt: new Date().toISOString(),
    }).run();
    db.insert(schema.readHistory).values({ id: 'r1', postId: 'p1' }).run();

    const rows = db.select().from(schema.readHistory).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].postId).toBe('p1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/db/schema.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement schema.ts**

`packages/core/src/db/schema.ts`:
```typescript
import { sqliteTable, text, integer, real, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamps = {
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
};

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  adapter: text('adapter').notNull(),
  enabled: integer('enabled').notNull().default(1),
  fetchInterval: integer('fetch_interval').notNull().default(60),
  lastFetchedAt: text('last_fetched_at'),
  ...timestamps,
});

export const siteConfigs = sqliteTable('site_configs', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('site_configs_site_id_key_unique').on(table.siteId, table.key),
]);

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  externalId: text('external_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  url: text('url').notNull(),
  author: text('author'),
  score: integer('score').default(0),
  aiScore: real('ai_score'),
  aiReason: text('ai_reason'),
  publishedAt: text('published_at'),
  fetchedAt: text('fetched_at').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('posts_site_external_unique').on(table.siteId, table.externalId),
]);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  ...timestamps,
});

export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
]);

export const readHistory = sqliteTable('read_history', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().unique().references(() => posts.id),
  ...timestamps,
});

export const interests = sqliteTable('interests', {
  id: text('id').primaryKey(),
  keyword: text('keyword').notNull().unique(),
  weight: real('weight').notNull().default(1.0),
  source: text('source').notNull(),
  ...timestamps,
});
```

- [ ] **Step 4: Implement connection.ts**

`packages/core/src/db/connection.ts`:
```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export function createDb(dbPath: string) {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type AppDb = ReturnType<typeof createDb>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/db/schema.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/db/ packages/core/tests/db/
git commit -m "feat: add database schema and connection (7 tables, drizzle-orm)"
```

---

## Task 3: Site Service

**Goal:** CRUD operations for sites and site_configs.

**Files:**
- Create: `packages/core/src/services/site.service.ts`
- Create: `packages/core/tests/services/site.test.ts`

**Dependencies:** Task 2

- [ ] **Step 1: Write site service tests**

`packages/core/tests/services/site.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/db/schema.js';
import { SiteService } from '../../src/services/site.service.js';
import { createTestDb } from '../test-helpers.js';

describe('SiteService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: Database.Database;
  let service: SiteService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    service = new SiteService(db);
  });

  afterEach(() => sqlite.close());

  it('should create a site', () => {
    const site = service.create({ name: 'Hacker News', adapter: 'hackernews' });
    expect(site.name).toBe('Hacker News');
    expect(site.adapter).toBe('hackernews');
    expect(site.enabled).toBe(1);
  });

  it('should list all sites', () => {
    service.create({ name: 'HN', adapter: 'hackernews' });
    service.create({ name: 'Reddit', adapter: 'reddit' });
    const sites = service.listAll();
    expect(sites).toHaveLength(2);
  });

  it('should update a site', () => {
    const site = service.create({ name: 'HN', adapter: 'hn' });
    service.update(site.id, { enabled: 0, fetchInterval: 30 });
    const updated = service.getById(site.id);
    expect(updated?.enabled).toBe(0);
    expect(updated?.fetchInterval).toBe(30);
  });

  it('should manage site configs', () => {
    const site = service.create({ name: 'Reddit', adapter: 'reddit' });
    service.setConfig(site.id, 'subreddit', 'programming');
    service.setConfig(site.id, 'limit', '25');
    const configs = service.getConfigs(site.id);
    expect(configs).toEqual({ subreddit: 'programming', limit: '25' });
  });

  it('should upsert site configs', () => {
    const site = service.create({ name: 'Reddit', adapter: 'reddit' });
    service.setConfig(site.id, 'subreddit', 'programming');
    service.setConfig(site.id, 'subreddit', 'typescript');
    const configs = service.getConfigs(site.id);
    expect(configs.subreddit).toBe('typescript');
  });

  it('should delete a site', () => {
    const site = service.create({ name: 'HN', adapter: 'hn' });
    service.delete(site.id);
    expect(service.getById(site.id)).toBeUndefined();
  });
});
```

Also create the shared test helper:

`packages/core/tests/test-helpers.ts`:
```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/db/schema.js';

const CREATE_TABLES_SQL = `
  CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    adapter TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    fetch_interval INTEGER NOT NULL DEFAULT 60,
    last_fetched_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE site_configs (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(site_id, key)
  );
  CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT NOT NULL,
    author TEXT,
    score INTEGER DEFAULT 0,
    ai_score REAL,
    ai_reason TEXT,
    published_at TEXT,
    fetched_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(site_id, external_id)
  );
  CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE post_tags (
    post_id TEXT NOT NULL REFERENCES posts(id),
    tag_id TEXT NOT NULL REFERENCES tags(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY(post_id, tag_id)
  );
  CREATE TABLE read_history (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL UNIQUE REFERENCES posts(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE interests (
    id TEXT PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    weight REAL NOT NULL DEFAULT 1.0,
    source TEXT NOT NULL CHECK(source IN ('manual','learned')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(CREATE_TABLES_SQL);
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/services/site.test.ts`
Expected: FAIL — SiteService not found.

- [ ] **Step 3: Implement SiteService**

`packages/core/src/services/site.service.ts`:
```typescript
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { sites, siteConfigs } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';

interface CreateSiteInput {
  name: string;
  adapter: string;
  enabled?: number;
  fetchInterval?: number;
}

interface UpdateSiteInput {
  name?: string;
  enabled?: number;
  fetchInterval?: number;
  lastFetchedAt?: string;
}

export class SiteService {
  constructor(private db: AppDb) {}

  create(input: CreateSiteInput) {
    const id = uuid();
    this.db.insert(sites).values({
      id,
      name: input.name,
      adapter: input.adapter,
      enabled: input.enabled ?? 1,
      fetchInterval: input.fetchInterval ?? 60,
    }).run();
    return this.getById(id)!;
  }

  getById(id: string) {
    return this.db.select().from(sites).where(eq(sites.id, id)).get();
  }

  listAll() {
    return this.db.select().from(sites).all();
  }

  listEnabled() {
    return this.db.select().from(sites).where(eq(sites.enabled, 1)).all();
  }

  update(id: string, input: UpdateSiteInput) {
    this.db.update(sites).set({
      ...input,
      updatedAt: new Date().toISOString(),
    }).where(eq(sites.id, id)).run();
  }

  delete(id: string) {
    this.db.delete(siteConfigs).where(eq(siteConfigs.siteId, id)).run();
    this.db.delete(sites).where(eq(sites.id, id)).run();
  }

  setConfig(siteId: string, key: string, value: string) {
    const existing = this.db.select().from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId))
      .all()
      .find(c => c.key === key);

    if (existing) {
      this.db.update(siteConfigs).set({
        value,
        updatedAt: new Date().toISOString(),
      }).where(eq(siteConfigs.id, existing.id)).run();
    } else {
      this.db.insert(siteConfigs).values({
        id: uuid(),
        siteId,
        key,
        value,
      }).run();
    }
  }

  getConfigs(siteId: string): Record<string, string> {
    const rows = this.db.select().from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId)).all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/services/site.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/services/site.service.ts packages/core/tests/
git commit -m "feat: add SiteService with CRUD and config management"
```

---

## Task 4: Adapter Interface & HackerNews Adapter

**Goal:** Define the adapter interface and implement the first adapter (HackerNews).

**Files:**
- Create: `packages/core/src/adapters/adapter.interface.ts`
- Create: `packages/core/src/adapters/hackernews.adapter.ts`
- Create: `packages/core/src/adapters/index.ts`
- Create: `packages/core/tests/adapters/hackernews.test.ts`

**Dependencies:** Task 1

- [ ] **Step 1: Write adapter interface**

`packages/core/src/adapters/adapter.interface.ts`:
```typescript
export interface RawPost {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  author?: string;
  score: number;
  publishedAt?: Date;
}

export interface SiteConfig {
  [key: string]: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number';
  required?: boolean;
  defaultValue?: string;
}

export interface Adapter {
  name: string;
  displayName: string;
  fetchPosts(config: SiteConfig): Promise<RawPost[]>;
  configSchema?: ConfigField[];
}
```

- [ ] **Step 2: Write HackerNews adapter test**

`packages/core/tests/adapters/hackernews.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HackerNewsAdapter } from '../../src/adapters/hackernews.adapter.js';

// Mock undici fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('HackerNewsAdapter', () => {
  const adapter = new HackerNewsAdapter();

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should have correct name and displayName', () => {
    expect(adapter.name).toBe('hackernews');
    expect(adapter.displayName).toBe('Hacker News');
  });

  it('should fetch and parse top stories', async () => {
    // Mock top stories endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([101, 102]),
    });
    // Mock individual story endpoints
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 101,
        title: 'Show HN: My Project',
        url: 'https://example.com/project',
        by: 'user1',
        score: 150,
        time: 1700000000,
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 102,
        title: 'Ask HN: Best Language?',
        url: '',
        by: 'user2',
        score: 80,
        time: 1700001000,
        text: 'What do you think about...',
      }),
    });

    const posts = await adapter.fetchPosts({ limit: '2' });

    expect(posts).toHaveLength(2);
    expect(posts[0].externalId).toBe('101');
    expect(posts[0].title).toBe('Show HN: My Project');
    expect(posts[0].url).toBe('https://example.com/project');
    expect(posts[0].score).toBe(150);
    // Ask HN posts without url should link to HN
    expect(posts[1].url).toContain('news.ycombinator.com');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/adapters/hackernews.test.ts`
Expected: FAIL — HackerNewsAdapter not found.

- [ ] **Step 4: Implement HackerNewsAdapter**

`packages/core/src/adapters/hackernews.adapter.ts`:
```typescript
import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

const HN_API = 'https://hacker-news.firebaseio.com/v0';

interface HNItem {
  id: number;
  title: string;
  url?: string;
  by?: string;
  score: number;
  time: number;
  text?: string;
}

export class HackerNewsAdapter implements Adapter {
  name = 'hackernews';
  displayName = 'Hacker News';

  configSchema = [
    { key: 'limit', label: 'Number of posts', type: 'number' as const, defaultValue: '30' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const limit = parseInt(config.limit || '30', 10);

    const res = await fetch(`${HN_API}/topstories.json`);
    const ids: number[] = await res.json();
    const topIds = ids.slice(0, limit);

    const items = await Promise.all(
      topIds.map(async (id) => {
        const r = await fetch(`${HN_API}/item/${id}.json`);
        return r.json() as Promise<HNItem>;
      })
    );

    return items.map((item) => ({
      externalId: String(item.id),
      title: item.title,
      summary: item.text?.slice(0, 200),
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      author: item.by,
      score: item.score,
      publishedAt: new Date(item.time * 1000),
    }));
  }
}
```

- [ ] **Step 5: Create adapter registry**

`packages/core/src/adapters/index.ts`:
```typescript
import type { Adapter } from './adapter.interface.js';
import { HackerNewsAdapter } from './hackernews.adapter.js';

const adapters = new Map<string, Adapter>();

function register(adapter: Adapter) {
  adapters.set(adapter.name, adapter);
}

register(new HackerNewsAdapter());

export function getAdapter(name: string): Adapter | undefined {
  return adapters.get(name);
}

export function getAllAdapters(): Adapter[] {
  return Array.from(adapters.values());
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/adapters/hackernews.test.ts`
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/adapters/ packages/core/tests/adapters/
git commit -m "feat: add adapter interface and HackerNews adapter"
```

---

## Task 5: Reddit, V2ex, Medium Adapters

**Goal:** Implement remaining 3 adapters.

**Files:**
- Create: `packages/core/src/adapters/reddit.adapter.ts`
- Create: `packages/core/src/adapters/v2ex.adapter.ts`
- Create: `packages/core/src/adapters/medium.adapter.ts`
- Create: `packages/core/tests/adapters/reddit.test.ts`
- Create: `packages/core/tests/adapters/v2ex.test.ts`
- Create: `packages/core/tests/adapters/medium.test.ts`
- Modify: `packages/core/src/adapters/index.ts` (register new adapters)

**Dependencies:** Task 4

- [ ] **Step 1: Write Reddit adapter test**

`packages/core/tests/adapters/reddit.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedditAdapter } from '../../src/adapters/reddit.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('RedditAdapter', () => {
  const adapter = new RedditAdapter();

  beforeEach(() => mockFetch.mockReset());

  it('should have correct name', () => {
    expect(adapter.name).toBe('reddit');
  });

  it('should fetch subreddit hot posts', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: {
          children: [
            {
              data: {
                id: 'abc123',
                title: 'Rust is fast',
                selftext: 'Some text about Rust...',
                url: 'https://reddit.com/r/programming/abc',
                permalink: '/r/programming/comments/abc123/rust_is_fast/',
                author: 'rustfan',
                score: 500,
                created_utc: 1700000000,
              },
            },
          ],
        },
      }),
    });

    const posts = await adapter.fetchPosts({ subreddit: 'programming', limit: '10' });
    expect(posts).toHaveLength(1);
    expect(posts[0].externalId).toBe('abc123');
    expect(posts[0].score).toBe(500);
  });
});
```

- [ ] **Step 2: Implement RedditAdapter**

`packages/core/src/adapters/reddit.adapter.ts`:
```typescript
import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  author: string;
  score: number;
  created_utc: number;
}

export class RedditAdapter implements Adapter {
  name = 'reddit';
  displayName = 'Reddit';

  configSchema = [
    { key: 'subreddit', label: 'Subreddit name', type: 'text' as const, required: true, defaultValue: 'programming' },
    { key: 'limit', label: 'Number of posts', type: 'number' as const, defaultValue: '25' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const subreddit = config.subreddit || 'programming';
    const limit = config.limit || '25';

    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      { headers: { 'User-Agent': 'DevPulse/0.1' } }
    );
    const json = await res.json();

    return json.data.children.map((child: { data: RedditPost }) => {
      const d = child.data;
      return {
        externalId: d.id,
        title: d.title,
        summary: d.selftext?.slice(0, 200) || undefined,
        url: d.url.startsWith('/') ? `https://reddit.com${d.url}` : d.url,
        author: d.author,
        score: d.score,
        publishedAt: new Date(d.created_utc * 1000),
      };
    });
  }
}
```

- [ ] **Step 3: Write V2ex adapter test and implement**

`packages/core/tests/adapters/v2ex.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { V2exAdapter } from '../../src/adapters/v2ex.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('V2exAdapter', () => {
  const adapter = new V2exAdapter();

  beforeEach(() => mockFetch.mockReset());

  it('should have correct name', () => {
    expect(adapter.name).toBe('v2ex');
  });

  it('should fetch hot topics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 999,
          title: 'V2ex Topic',
          content: 'Some content here...',
          url: 'https://www.v2ex.com/t/999',
          member: { username: 'user1' },
          replies: 42,
          created: 1700000000,
        },
      ]),
    });

    const posts = await adapter.fetchPosts({});
    expect(posts).toHaveLength(1);
    expect(posts[0].externalId).toBe('999');
    expect(posts[0].score).toBe(42);
  });
});
```

`packages/core/src/adapters/v2ex.adapter.ts`:
```typescript
import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

interface V2exTopic {
  id: number;
  title: string;
  content: string;
  url: string;
  member: { username: string };
  replies: number;
  created: number;
}

export class V2exAdapter implements Adapter {
  name = 'v2ex';
  displayName = 'V2EX';

  configSchema = [
    { key: 'token', label: 'API Token (optional)', type: 'text' as const },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const headers: Record<string, string> = {};
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    const res = await fetch('https://www.v2ex.com/api/topics/hot.json', { headers });
    const topics: V2exTopic[] = await res.json();

    return topics.map((t) => ({
      externalId: String(t.id),
      title: t.title,
      summary: t.content?.slice(0, 200) || undefined,
      url: t.url || `https://www.v2ex.com/t/${t.id}`,
      author: t.member?.username,
      score: t.replies,
      publishedAt: new Date(t.created * 1000),
    }));
  }
}
```

- [ ] **Step 4: Write Medium adapter test and implement**

`packages/core/tests/adapters/medium.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediumAdapter } from '../../src/adapters/medium.adapter.js';

vi.mock('rss-parser', () => {
  return {
    default: class {
      async parseURL() {
        return {
          items: [
            {
              guid: 'medium-post-1',
              title: 'AI in 2026',
              contentSnippet: 'The future of AI...',
              link: 'https://medium.com/p/123',
              creator: 'writer1',
              pubDate: '2026-03-15T00:00:00Z',
            },
          ],
        };
      }
    },
  };
});

describe('MediumAdapter', () => {
  const adapter = new MediumAdapter();

  it('should have correct name', () => {
    expect(adapter.name).toBe('medium');
  });

  it('should parse RSS feed', async () => {
    const posts = await adapter.fetchPosts({ feedUrl: 'https://medium.com/feed/tag/programming' });
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('AI in 2026');
    expect(posts[0].score).toBe(0);
  });
});
```

`packages/core/src/adapters/medium.adapter.ts`:
```typescript
import RSSParser from 'rss-parser';
import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

const parser = new RSSParser();

export class MediumAdapter implements Adapter {
  name = 'medium';
  displayName = 'Medium';

  configSchema = [
    { key: 'feedUrl', label: 'RSS Feed URL', type: 'text' as const, required: true, defaultValue: 'https://medium.com/feed/tag/programming' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const feedUrl = config.feedUrl || 'https://medium.com/feed/tag/programming';
    const feed = await parser.parseURL(feedUrl);

    return feed.items.map((item, index) => ({
      externalId: item.guid || item.link || String(index),
      title: item.title || 'Untitled',
      summary: item.contentSnippet?.slice(0, 200),
      url: item.link || '',
      author: item.creator,
      score: 0, // RSS has no score; will rely on AI scoring
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
    }));
  }
}
```

- [ ] **Step 5: Register all adapters**

Update `packages/core/src/adapters/index.ts`:
```typescript
import type { Adapter } from './adapter.interface.js';
import { HackerNewsAdapter } from './hackernews.adapter.js';
import { RedditAdapter } from './reddit.adapter.js';
import { V2exAdapter } from './v2ex.adapter.js';
import { MediumAdapter } from './medium.adapter.js';

const adapters = new Map<string, Adapter>();

function register(adapter: Adapter) {
  adapters.set(adapter.name, adapter);
}

register(new HackerNewsAdapter());
register(new RedditAdapter());
register(new V2exAdapter());
register(new MediumAdapter());

export function getAdapter(name: string): Adapter | undefined {
  return adapters.get(name);
}

export function getAllAdapters(): Adapter[] {
  return Array.from(adapters.values());
}
```

- [ ] **Step 6: Run all adapter tests**

Run: `cd packages/core && pnpm vitest run tests/adapters/`
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/adapters/ packages/core/tests/adapters/
git commit -m "feat: add Reddit, V2ex, and Medium adapters"
```

---

## Task 6: Post Service

**Goal:** Query posts with sorting, filtering, pagination, and read marking.

**Files:**
- Create: `packages/core/src/services/post.service.ts`
- Create: `packages/core/tests/services/post.test.ts`

**Dependencies:** Task 2

- [ ] **Step 1: Write post service tests**

`packages/core/tests/services/post.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as schema from '../../src/db/schema.js';
import { createTestDb } from '../test-helpers.js';
import { PostService } from '../../src/services/post.service.js';

describe('PostService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;
  let service: PostService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    service = new PostService(db);
    // Seed a site
    db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
  });

  afterEach(() => sqlite.close());

  it('should save posts and deduplicate by site+externalId', () => {
    service.savePosts('s1', [
      { externalId: '1', title: 'T1', url: 'http://a', score: 10 },
      { externalId: '2', title: 'T2', url: 'http://b', score: 20 },
    ]);
    service.savePosts('s1', [
      { externalId: '1', title: 'T1-updated', url: 'http://a', score: 15 },
      { externalId: '3', title: 'T3', url: 'http://c', score: 5 },
    ]);
    const posts = service.list({});
    expect(posts).toHaveLength(3);
  });

  it('should filter posts by siteId', () => {
    service.savePosts('s1', [
      { externalId: '1', title: 'T1', url: 'http://a', score: 10 },
    ]);
    const filtered = service.list({ siteId: 's1' });
    expect(filtered).toHaveLength(1);
    const empty = service.list({ siteId: 'nonexistent' });
    expect(empty).toHaveLength(0);
  });

  it('should mark post as read and filter unread', () => {
    service.savePosts('s1', [
      { externalId: '1', title: 'T1', url: 'http://a', score: 10 },
      { externalId: '2', title: 'T2', url: 'http://b', score: 20 },
    ]);
    const posts = service.list({});
    service.markAsRead(posts[0].id);

    const unread = service.list({ unreadOnly: true });
    expect(unread).toHaveLength(1);
    expect(unread[0].title).toBe('T2');
  });

  it('should sort by finalScore (ai_score weighted)', () => {
    service.savePosts('s1', [
      { externalId: '1', title: 'Low', url: 'http://a', score: 10 },
      { externalId: '2', title: 'High', url: 'http://b', score: 100 },
    ]);
    // Manually set AI scores
    const posts = service.list({});
    service.updateAiScore(posts.find(p => p.title === 'Low')!.id, 0.9, 'Very relevant', []);
    service.updateAiScore(posts.find(p => p.title === 'High')!.id, 0.1, 'Not relevant', []);

    const sorted = service.list({ sortBy: 'score' });
    // Low has higher AI score, should rank higher after weighting
    expect(sorted[0].title).toBe('Low');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/services/post.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement PostService**

`packages/core/src/services/post.service.ts`:
```typescript
import { eq, and, sql, desc, isNull, notInArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { posts, readHistory, tags, postTags } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';
import type { RawPost } from '../adapters/adapter.interface.js';

interface ListOptions {
  siteId?: string;
  unreadOnly?: boolean;
  sortBy?: 'score' | 'time';
  limit?: number;
  offset?: number;
}

export class PostService {
  constructor(private db: AppDb) {}

  savePosts(siteId: string, rawPosts: Omit<RawPost, 'publishedAt'> & { publishedAt?: Date }[]) {
    const now = new Date().toISOString();
    for (const raw of rawPosts) {
      // Upsert: skip if exists
      const existing = this.db.select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.siteId, siteId), eq(posts.externalId, raw.externalId)))
        .get();

      if (existing) {
        // Update score if changed
        this.db.update(posts).set({
          score: raw.score,
          updatedAt: now,
        }).where(eq(posts.id, existing.id)).run();
      } else {
        this.db.insert(posts).values({
          id: uuid(),
          siteId,
          externalId: raw.externalId,
          title: raw.title,
          summary: raw.summary,
          url: raw.url,
          author: raw.author,
          score: raw.score,
          publishedAt: raw.publishedAt?.toISOString(),
          fetchedAt: now,
        }).run();
      }
    }
  }

  list(options: ListOptions) {
    let query = this.db.select().from(posts);
    const conditions = [];

    if (options.siteId) {
      conditions.push(eq(posts.siteId, options.siteId));
    }

    if (options.unreadOnly) {
      const readPostIds = this.db.select({ postId: readHistory.postId }).from(readHistory).all().map(r => r.postId);
      if (readPostIds.length > 0) {
        conditions.push(notInArray(posts.id, readPostIds));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    let rows = where ? query.where(where).all() : query.all();

    // Compute final_score and sort
    if (options.sortBy === 'score' || !options.sortBy) {
      // Normalize site scores per site
      const siteMaxScores = new Map<string, number>();
      for (const row of rows) {
        const current = siteMaxScores.get(row.siteId) || 0;
        if ((row.score || 0) > current) {
          siteMaxScores.set(row.siteId, row.score || 0);
        }
      }

      rows.sort((a, b) => {
        const aMaxScore = siteMaxScores.get(a.siteId) || 1;
        const bMaxScore = siteMaxScores.get(b.siteId) || 1;
        const aNorm = (a.score || 0) / (aMaxScore || 1);
        const bNorm = (b.score || 0) / (bMaxScore || 1);
        const aFinal = aNorm * 0.4 + (a.aiScore ?? aNorm) * 0.6;
        const bFinal = bNorm * 0.4 + (b.aiScore ?? bNorm) * 0.6;
        return bFinal - aFinal;
      });
    } else {
      rows.sort((a, b) => {
        const aTime = a.publishedAt || a.fetchedAt;
        const bTime = b.publishedAt || b.fetchedAt;
        return bTime.localeCompare(aTime);
      });
    }

    const offset = options.offset || 0;
    const limit = options.limit || 50;
    return rows.slice(offset, offset + limit);
  }

  markAsRead(postId: string) {
    const existing = this.db.select().from(readHistory).where(eq(readHistory.postId, postId)).get();
    if (!existing) {
      this.db.insert(readHistory).values({ id: uuid(), postId }).run();
    }
  }

  isRead(postId: string): boolean {
    return !!this.db.select().from(readHistory).where(eq(readHistory.postId, postId)).get();
  }

  getPostTags(postId: string): string[] {
    const rows = this.db.select({ name: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, postId))
      .all();
    return rows.map(r => r.name);
  }

  updateAiScore(postId: string, aiScore: number, aiReason: string, tagNames: string[]) {
    this.db.update(posts).set({
      aiScore,
      aiReason,
      updatedAt: new Date().toISOString(),
    }).where(eq(posts.id, postId)).run();

    // Upsert tags and link
    for (const name of tagNames) {
      let tag = this.db.select().from(tags).where(eq(tags.name, name)).get();
      if (!tag) {
        const tagId = uuid();
        this.db.insert(tags).values({ id: tagId, name }).run();
        tag = { id: tagId, name, createdAt: '', updatedAt: '' };
      }
      const existing = this.db.select().from(postTags)
        .where(and(eq(postTags.postId, postId), eq(postTags.tagId, tag.id))).get();
      if (!existing) {
        this.db.insert(postTags).values({ postId, tagId: tag.id }).run();
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/services/post.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/services/post.service.ts packages/core/tests/services/post.test.ts
git commit -m "feat: add PostService with CRUD, dedup, read tracking, and scoring"
```

---

## Task 7: AI Service

**Goal:** Batch scoring of posts via Claude API with fallback.

**Files:**
- Create: `packages/core/src/services/ai.service.ts`
- Create: `packages/core/tests/services/ai.test.ts`

**Dependencies:** Task 2

- [ ] **Step 1: Write AI service tests**

`packages/core/tests/services/ai.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../../src/services/ai.service.js';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    mockCreate.mockReset();
    service = new AiService('test-api-key');
  });

  it('should score posts and return results', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify([
          { index: 0, score: 0.85, tags: ['AI', 'LLM'], reason: 'Highly relevant to AI interest' },
          { index: 1, score: 0.3, tags: ['DevOps'], reason: 'Low relevance' },
        ]),
      }],
    });

    const results = await service.scorePosts(
      [
        { title: 'New LLM Breakthrough', summary: 'A new model...', source: 'HN' },
        { title: 'Docker Tips', summary: 'Container tricks...', source: 'Reddit' },
      ],
      [{ keyword: 'AI', weight: 0.9 }],
    );

    expect(results).toHaveLength(2);
    expect(results[0].score).toBe(0.85);
    expect(results[0].tags).toContain('AI');
    expect(results[1].score).toBe(0.3);
  });

  it('should return empty results on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Rate limited'));

    const results = await service.scorePosts(
      [{ title: 'Test', summary: '', source: 'HN' }],
      [],
    );

    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/services/ai.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement AiService**

`packages/core/src/services/ai.service.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

interface PostInput {
  title: string;
  summary?: string;
  source: string;
}

interface InterestInput {
  keyword: string;
  weight: number;
}

interface ScoreResult {
  index: number;
  score: number;
  tags: string[];
  reason: string;
}

export class AiService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async scorePosts(posts: PostInput[], interests: InterestInput[]): Promise<ScoreResult[]> {
    if (posts.length === 0) return [];

    const interestList = interests
      .map(i => `${i.keyword} (weight: ${i.weight})`)
      .join(', ') || 'No specific interests configured';

    const postList = posts
      .map((p, i) => `${i}. [${p.source}] ${p.title}${p.summary ? ` - ${p.summary}` : ''}`)
      .join('\n');

    const prompt = `You are a developer content recommendation assistant.
User interests: ${interestList}

Score these posts (0-1) based on relevance to the user's interests, extract tags, and give a brief reason:
${postList}

Return ONLY valid JSON array:
[{"index": 0, "score": 0.85, "tags": ["AI"], "reason": "..."}]`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]) as ScoreResult[];
    } catch (error) {
      console.error('AI scoring failed:', error);
      return [];
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/services/ai.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/services/ai.service.ts packages/core/tests/services/ai.test.ts
git commit -m "feat: add AiService with Claude API batch scoring and fallback"
```

---

## Task 8: Interest Service

**Goal:** CRUD interests, weight boost on read, decay on inactivity, learned keyword generation.

**Files:**
- Create: `packages/core/src/services/interest.service.ts`
- Create: `packages/core/tests/services/interest.test.ts`

**Dependencies:** Task 2

- [ ] **Step 1: Write interest service tests**

`packages/core/tests/services/interest.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../test-helpers.js';
import { InterestService } from '../../src/services/interest.service.js';
import * as schema from '../../src/db/schema.js';

describe('InterestService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;
  let service: InterestService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    service = new InterestService(db);
  });

  afterEach(() => sqlite.close());

  it('should add a manual interest', () => {
    service.add('Rust', 'manual');
    const all = service.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].keyword).toBe('Rust');
    expect(all[0].source).toBe('manual');
    expect(all[0].weight).toBe(1.0);
  });

  it('should not duplicate interests', () => {
    service.add('Rust', 'manual');
    service.add('Rust', 'manual');
    expect(service.listAll()).toHaveLength(1);
  });

  it('should boost weight when reading related tags', () => {
    service.add('AI', 'manual');
    service.boostForTags(['AI', 'LLM']);
    const interests = service.listAll();
    const ai = interests.find(i => i.keyword === 'AI');
    expect(ai!.weight).toBe(1.1);
    // LLM should be auto-created as learned
    const llm = interests.find(i => i.keyword === 'LLM');
    expect(llm).toBeDefined();
    expect(llm!.source).toBe('learned');
  });

  it('should decay unused interests', () => {
    service.add('OldTopic', 'learned');
    // Simulate 7 days of no activity by calling decay 7 times
    for (let i = 0; i < 7; i++) {
      service.decayUnused(new Set());
    }
    const interest = service.listAll().find(i => i.keyword === 'OldTopic');
    // 1.0 - 7 * 0.05 = 0.65
    expect(interest!.weight).toBeCloseTo(0.65);
  });

  it('should not decay below 0.1', () => {
    service.add('OldTopic', 'learned');
    for (let i = 0; i < 100; i++) {
      service.decayUnused(new Set());
    }
    const interest = service.listAll().find(i => i.keyword === 'OldTopic');
    expect(interest!.weight).toBeGreaterThanOrEqual(0.1);
  });

  it('should remove an interest', () => {
    service.add('Rust', 'manual');
    const all = service.listAll();
    service.remove(all[0].id);
    expect(service.listAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/services/interest.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement InterestService**

`packages/core/src/services/interest.service.ts`:
```typescript
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { interests } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';

const BOOST_INCREMENT = 0.1;
const DECAY_RATE = 0.05;
const MIN_WEIGHT = 0.1;

export class InterestService {
  constructor(private db: AppDb) {}

  add(keyword: string, source: 'manual' | 'learned', weight = 1.0) {
    const existing = this.db.select().from(interests).where(eq(interests.keyword, keyword)).get();
    if (existing) return existing;

    const id = uuid();
    this.db.insert(interests).values({ id, keyword, weight, source }).run();
    return this.db.select().from(interests).where(eq(interests.id, id)).get()!;
  }

  listAll() {
    return this.db.select().from(interests).all();
  }

  remove(id: string) {
    this.db.delete(interests).where(eq(interests.id, id)).run();
  }

  updateWeight(id: string, weight: number) {
    this.db.update(interests).set({
      weight: Math.max(MIN_WEIGHT, weight),
      updatedAt: new Date().toISOString(),
    }).where(eq(interests.id, id)).run();
  }

  boostForTags(tagNames: string[]) {
    for (const tag of tagNames) {
      const existing = this.db.select().from(interests).where(eq(interests.keyword, tag)).get();
      if (existing) {
        this.updateWeight(existing.id, existing.weight + BOOST_INCREMENT);
      } else {
        this.add(tag, 'learned', BOOST_INCREMENT);
      }
    }
  }

  decayUnused(activeKeywords: Set<string>) {
    const all = this.listAll();
    for (const interest of all) {
      if (!activeKeywords.has(interest.keyword)) {
        this.updateWeight(interest.id, interest.weight - DECAY_RATE);
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/services/interest.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/services/interest.service.ts packages/core/tests/services/interest.test.ts
git commit -m "feat: add InterestService with boost, decay, and learned keywords"
```

---

## Task 9: Fetcher Service

**Goal:** Orchestrate adapter calls, save posts, trigger AI scoring.

**Files:**
- Create: `packages/core/src/services/fetcher.service.ts`
- Create: `packages/core/tests/services/fetcher.test.ts`

**Dependencies:** Tasks 3, 4, 6, 7, 8

- [ ] **Step 1: Write fetcher service tests**

`packages/core/tests/services/fetcher.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../test-helpers.js';
import { FetcherService } from '../../src/services/fetcher.service.js';
import { SiteService } from '../../src/services/site.service.js';
import { PostService } from '../../src/services/post.service.js';
import { InterestService } from '../../src/services/interest.service.js';
import type { AiService } from '../../src/services/ai.service.js';
import type { Adapter, RawPost } from '../../src/adapters/adapter.interface.js';

describe('FetcherService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;

  const mockAdapter: Adapter = {
    name: 'test',
    displayName: 'Test',
    async fetchPosts() {
      return [
        { externalId: '1', title: 'Post 1', url: 'http://a', score: 100 },
        { externalId: '2', title: 'Post 2', url: 'http://b', score: 50 },
      ];
    },
  };

  const mockAiService = {
    scorePosts: vi.fn().mockResolvedValue([
      { index: 0, score: 0.9, tags: ['AI'], reason: 'Good' },
      { index: 1, score: 0.5, tags: ['DevOps'], reason: 'OK' },
    ]),
  } as unknown as AiService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    vi.clearAllMocks();
  });

  afterEach(() => sqlite.close());

  it('should fetch from adapter, save posts, and score', async () => {
    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);
    const fetcher = new FetcherService(postService, siteService, interestService, mockAiService, () => mockAdapter);

    const site = siteService.create({ name: 'Test', adapter: 'test' });
    await fetcher.fetchSite(site.id);

    const posts = postService.list({});
    expect(posts).toHaveLength(2);
    expect(posts.some(p => p.aiScore === 0.9)).toBe(true);
  });

  it('should handle adapter errors gracefully', async () => {
    const failAdapter: Adapter = {
      name: 'fail',
      displayName: 'Fail',
      async fetchPosts() { throw new Error('Network error'); },
    };

    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);
    const fetcher = new FetcherService(postService, siteService, interestService, mockAiService, () => failAdapter);

    const site = siteService.create({ name: 'Fail', adapter: 'fail' });
    // Should not throw
    await fetcher.fetchSite(site.id);

    const posts = postService.list({});
    expect(posts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run tests/services/fetcher.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement FetcherService**

`packages/core/src/services/fetcher.service.ts`:
```typescript
import type { Adapter } from '../adapters/adapter.interface.js';
import type { PostService } from './post.service.js';
import type { SiteService } from './site.service.js';
import type { InterestService } from './interest.service.js';
import type { AiService } from './ai.service.js';

const BATCH_SIZE = 20;

export class FetcherService {
  constructor(
    private postService: PostService,
    private siteService: SiteService,
    private interestService: InterestService,
    private aiService: AiService | null,
    private getAdapter: (name: string) => Adapter | undefined,
  ) {}

  async fetchSite(siteId: string) {
    const site = this.siteService.getById(siteId);
    if (!site) throw new Error(`Site ${siteId} not found`);

    const adapter = this.getAdapter(site.adapter);
    if (!adapter) throw new Error(`Adapter ${site.adapter} not found`);

    const config = this.siteService.getConfigs(siteId);

    let rawPosts;
    try {
      rawPosts = await adapter.fetchPosts(config);
    } catch (error) {
      console.error(`Failed to fetch from ${site.name}:`, error);
      return;
    }

    this.postService.savePosts(siteId, rawPosts);

    // Update last_fetched_at
    this.siteService.update(siteId, { lastFetchedAt: new Date().toISOString() });

    // AI scoring in batches (skip if no AI service configured)
    if (!this.aiService) return;

    const interests = this.interestService.listAll();
    const savedPosts = this.postService.list({ siteId });
    const unscoredPosts = savedPosts.filter(p => p.aiScore === null);

    for (let i = 0; i < unscoredPosts.length; i += BATCH_SIZE) {
      const batch = unscoredPosts.slice(i, i + BATCH_SIZE);
      const inputs = batch.map(p => ({
        title: p.title,
        summary: p.summary || undefined,
        source: site.name,
      }));

      const scores = await this.aiService.scorePosts(
        inputs,
        interests.map(i => ({ keyword: i.keyword, weight: i.weight })),
      );

      for (const result of scores) {
        const post = batch[result.index];
        if (post) {
          this.postService.updateAiScore(post.id, result.score, result.reason, result.tags);
        }
      }
    }
  }

  async fetchAll() {
    const enabledSites = this.siteService.listEnabled();
    for (const site of enabledSites) {
      await this.fetchSite(site.id);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && pnpm vitest run tests/services/fetcher.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/services/fetcher.service.ts packages/core/tests/services/fetcher.test.ts
git commit -m "feat: add FetcherService orchestrating adapters + AI scoring"
```

---

## Task 10: Update Core Package Exports

**Goal:** Ensure all public APIs are exported from index.ts.

**Files:**
- Modify: `packages/core/src/index.ts`

**Dependencies:** Tasks 2-9

- [ ] **Step 1: Update barrel export**

`packages/core/src/index.ts`:
```typescript
// Database
export * from './db/schema.js';
export { createDb, type AppDb } from './db/connection.js';

// Adapters
export * from './adapters/adapter.interface.js';
export { getAdapter, getAllAdapters } from './adapters/index.js';

// Database utilities
export { migrate } from './db/migrate.js';

// Services
export { SiteService } from './services/site.service.js';
export { PostService } from './services/post.service.js';
export { AiService } from './services/ai.service.js';
export { InterestService } from './services/interest.service.js';
export { FetcherService } from './services/fetcher.service.js';
```

- [ ] **Step 2: Run all core tests**

Run: `cd packages/core && pnpm vitest run`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat: export all core public APIs"
```

---

## Task 11: Fastify API Server

**Goal:** Build the API server with all routes.

**Files:**
- Create: `packages/web/server/app.ts`
- Create: `packages/web/server/start.ts`
- Create: `packages/web/server/routes/posts.routes.ts`
- Create: `packages/web/server/routes/sites.routes.ts`
- Create: `packages/web/server/routes/interests.routes.ts`
- Create: `packages/web/server/routes/fetch.routes.ts`

**Dependencies:** Task 10

- [ ] **Step 1: Create Fastify app with core wiring**

`packages/web/server/app.ts`:
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { resolve } from 'path';
import { createDb, SiteService, PostService, AiService, InterestService, FetcherService, getAdapter } from '@devpulse/core';
import { postsRoutes } from './routes/posts.routes.js';
import { sitesRoutes } from './routes/sites.routes.js';
import { interestsRoutes } from './routes/interests.routes.js';
import { fetchRoutes } from './routes/fetch.routes.js';

export interface AppServices {
  siteService: SiteService;
  postService: PostService;
  aiService: AiService | null;
  interestService: InterestService;
  fetcherService: FetcherService;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: AppServices;
  }
}

export async function buildApp(dbPath: string) {
  const app = Fastify({ logger: true });

  await app.register(cors);

  // Serve Vue static files in production
  const distPath = resolve(import.meta.dirname, '..', 'dist');
  await app.register(fastifyStatic, {
    root: distPath,
    wildcard: false,
  });

  // Initialize services
  const db = createDb(dbPath);
  const siteService = new SiteService(db);
  const postService = new PostService(db);
  const interestService = new InterestService(db);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const aiService = apiKey ? new AiService(apiKey) : null;

  const fetcherService = new FetcherService(
    postService, siteService, interestService,
    aiService,
    (name) => getAdapter(name),
  );

  app.decorate('services', {
    siteService, postService, aiService, interestService, fetcherService,
  });

  // Register routes
  await app.register(postsRoutes, { prefix: '/api' });
  await app.register(sitesRoutes, { prefix: '/api' });
  await app.register(interestsRoutes, { prefix: '/api' });
  await app.register(fetchRoutes, { prefix: '/api' });

  // SPA fallback
  app.setNotFoundHandler((req, reply) => {
    if (!req.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    reply.code(404).send({ error: 'Not found' });
  });

  return app;
}
```

- [ ] **Step 2: Create route files**

`packages/web/server/routes/posts.routes.ts`:
```typescript
import type { FastifyPluginAsync } from 'fastify';

export const postsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/posts', async (req) => {
    const { siteId, unreadOnly, sortBy, limit, offset } = req.query as any;
    return app.services.postService.list({
      siteId,
      unreadOnly: unreadOnly === 'true',
      sortBy: sortBy || 'score',
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  });

  app.post<{ Params: { id: string } }>('/posts/:id/read', async (req) => {
    app.services.postService.markAsRead(req.params.id);

    // Boost interests for this post's tags
    const postTags = app.services.postService.getPostTags(req.params.id);
    if (postTags.length > 0) {
      app.services.interestService.boostForTags(postTags);
    }
    return { ok: true };
  });
};
```

`packages/web/server/routes/sites.routes.ts`:
```typescript
import type { FastifyPluginAsync } from 'fastify';

export const sitesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/sites', async () => {
    return app.services.siteService.listAll();
  });

  app.post<{ Body: { name: string; adapter: string; config?: Record<string, string> } }>('/sites', async (req) => {
    const { name, adapter, config } = req.body;
    const site = app.services.siteService.create({ name, adapter });
    if (config) {
      for (const [key, value] of Object.entries(config)) {
        app.services.siteService.setConfig(site.id, key, value);
      }
    }
    return site;
  });

  app.put<{ Params: { id: string }; Body: { enabled?: number; fetchInterval?: number } }>('/sites/:id', async (req) => {
    app.services.siteService.update(req.params.id, req.body);
    return app.services.siteService.getById(req.params.id);
  });

  app.delete<{ Params: { id: string } }>('/sites/:id', async (req) => {
    app.services.siteService.delete(req.params.id);
    return { ok: true };
  });

  app.get<{ Params: { id: string } }>('/sites/:id/config', async (req) => {
    return app.services.siteService.getConfigs(req.params.id);
  });

  app.put<{ Params: { id: string }; Body: Record<string, string> }>('/sites/:id/config', async (req) => {
    for (const [key, value] of Object.entries(req.body)) {
      app.services.siteService.setConfig(req.params.id, key, value);
    }
    return app.services.siteService.getConfigs(req.params.id);
  });
};
```

`packages/web/server/routes/interests.routes.ts`:
```typescript
import type { FastifyPluginAsync } from 'fastify';

export const interestsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/interests', async () => {
    return app.services.interestService.listAll();
  });

  app.post<{ Body: { keyword: string } }>('/interests', async (req) => {
    return app.services.interestService.add(req.body.keyword, 'manual');
  });

  app.delete<{ Params: { id: string } }>('/interests/:id', async (req) => {
    app.services.interestService.remove(req.params.id);
    return { ok: true };
  });
};
```

`packages/web/server/routes/fetch.routes.ts`:
```typescript
import type { FastifyPluginAsync } from 'fastify';

export const fetchRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { siteId?: string } }>('/fetch', async (req) => {
    if (req.body.siteId) {
      await app.services.fetcherService.fetchSite(req.body.siteId);
    } else {
      await app.services.fetcherService.fetchAll();
    }
    return { ok: true };
  });
};
```

- [ ] **Step 3: Create server entry point with cron**

`packages/web/server/start.ts`:
```typescript
import cron from 'node-cron';
import { resolve } from 'path';
import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3377', 10);
const DB_PATH = process.env.DB_PATH || resolve(process.cwd(), 'devpulse.db');

async function main() {
  const app = await buildApp(DB_PATH);

  // Schedule fetch every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled fetch...');
    try {
      await app.services.fetcherService.fetchAll();
    } catch (err) {
      console.error('Scheduled fetch failed:', err);
    }
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`DevPulse running at http://localhost:${PORT}`);
}

main().catch(console.error);
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/server/
git commit -m "feat: add Fastify API server with all routes and cron scheduler"
```

---

## Task 12: Vue Frontend — Feed Page

**Goal:** Build the main feed list page.

**Files:**
- Create: `packages/web/src/api/client.ts`
- Create: `packages/web/src/pages/Feed.vue`
- Create: `packages/web/src/components/PostItem.vue`
- Create: `packages/web/src/components/SiteFilter.vue`

**Dependencies:** Task 11

- [ ] **Step 1: Create API client**

`packages/web/src/api/client.ts`:
```typescript
const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  posts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/posts${qs}`);
    },
    markAsRead: (id: string) =>
      request(`/posts/${id}/read`, { method: 'POST' }),
  },
  sites: {
    list: () => request<any[]>('/sites'),
    create: (body: any) => request('/sites', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/sites/${id}`, { method: 'DELETE' }),
    getConfig: (id: string) => request<Record<string, string>>(`/sites/${id}/config`),
    updateConfig: (id: string, body: any) => request(`/sites/${id}/config`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  interests: {
    list: () => request<any[]>('/interests'),
    add: (keyword: string) => request('/interests', { method: 'POST', body: JSON.stringify({ keyword }) }),
    remove: (id: string) => request(`/interests/${id}`, { method: 'DELETE' }),
  },
  fetch: {
    trigger: (siteId?: string) =>
      request('/fetch', { method: 'POST', body: JSON.stringify({ siteId }) }),
  },
};
```

- [ ] **Step 2: Create PostItem component**

`packages/web/src/components/PostItem.vue`:
```vue
<script setup lang="ts">
const props = defineProps<{
  post: {
    id: string;
    title: string;
    url: string;
    author?: string;
    score: number;
    aiScore?: number;
    aiReason?: string;
    siteName?: string;
    publishedAt?: string;
    isRead: boolean;
  };
}>();

const emit = defineEmits<{
  read: [id: string];
}>();

function handleClick() {
  emit('read', props.post.id);
  window.open(props.post.url, '_blank');
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
</script>

<template>
  <div class="post-item" :class="{ read: post.isRead }" @click="handleClick">
    <div class="post-main">
      <h3 class="post-title">{{ post.title }}</h3>
      <div class="post-meta">
        <span class="post-source" v-if="post.siteName">{{ post.siteName }}</span>
        <span class="post-score">▲ {{ post.score }}</span>
        <span class="post-author" v-if="post.author">by {{ post.author }}</span>
        <span class="post-time">{{ timeAgo(post.publishedAt) }}</span>
      </div>
      <p class="post-reason" v-if="post.aiReason">{{ post.aiReason }}</p>
    </div>
  </div>
</template>

<style scoped>
.post-item {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.15s;
}
.post-item:hover { background: #f8f9fa; }
.post-item.read { opacity: 0.5; }
.post-title { margin: 0 0 4px; font-size: 15px; font-weight: 500; }
.post-meta { font-size: 12px; color: #666; display: flex; gap: 12px; }
.post-source { color: #0969da; font-weight: 500; }
.post-score { color: #e67700; }
.post-reason { font-size: 13px; color: #888; margin: 4px 0 0; }
</style>
```

- [ ] **Step 3: Create SiteFilter component**

`packages/web/src/components/SiteFilter.vue`:
```vue
<script setup lang="ts">
defineProps<{
  sites: { id: string; name: string }[];
  activeSiteId: string | null;
}>();

const emit = defineEmits<{
  select: [siteId: string | null];
}>();
</script>

<template>
  <div class="site-filter">
    <button
      :class="{ active: !activeSiteId }"
      @click="emit('select', null)"
    >All</button>
    <button
      v-for="site in sites"
      :key="site.id"
      :class="{ active: activeSiteId === site.id }"
      @click="emit('select', site.id)"
    >{{ site.name }}</button>
  </div>
</template>

<style scoped>
.site-filter { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #eee; flex-wrap: wrap; }
.site-filter button {
  padding: 4px 12px; border: 1px solid #ddd; border-radius: 16px;
  background: white; cursor: pointer; font-size: 13px;
}
.site-filter button.active { background: #0969da; color: white; border-color: #0969da; }
</style>
```

- [ ] **Step 4: Create Feed page**

`packages/web/src/pages/Feed.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../api/client';
import PostItem from '../components/PostItem.vue';
import SiteFilter from '../components/SiteFilter.vue';

const posts = ref<any[]>([]);
const sites = ref<any[]>([]);
const activeSiteId = ref<string | null>(null);
const hideRead = ref(false);
const sortBy = ref<'score' | 'time'>('score');
const loading = ref(false);
const readIds = ref(new Set<string>());

async function loadPosts() {
  loading.value = true;
  const params: Record<string, string> = { sortBy: sortBy.value };
  if (activeSiteId.value) params.siteId = activeSiteId.value;
  if (hideRead.value) params.unreadOnly = 'true';
  posts.value = await api.posts.list(params);
  loading.value = false;
}

async function handleRead(id: string) {
  readIds.value.add(id);
  await api.posts.markAsRead(id);
}

async function handleRefresh() {
  loading.value = true;
  await api.fetch.trigger(activeSiteId.value || undefined);
  await loadPosts();
}

onMounted(async () => {
  sites.value = await api.sites.list();
  await loadPosts();
});

const displayPosts = computed(() =>
  posts.value.map(p => ({
    ...p,
    isRead: readIds.value.has(p.id),
    siteName: sites.value.find(s => s.id === p.siteId)?.name,
  }))
);
</script>

<template>
  <div class="feed">
    <header class="feed-header">
      <h1>DevPulse</h1>
      <div class="feed-actions">
        <label><input type="checkbox" v-model="hideRead" @change="loadPosts"> Hide read</label>
        <select v-model="sortBy" @change="loadPosts">
          <option value="score">By relevance</option>
          <option value="time">By time</option>
        </select>
        <button @click="handleRefresh" :disabled="loading">
          {{ loading ? 'Fetching...' : 'Refresh' }}
        </button>
        <router-link to="/settings">Settings</router-link>
      </div>
    </header>

    <SiteFilter :sites="sites" :active-site-id="activeSiteId" @select="(id) => { activeSiteId = id; loadPosts(); }" />

    <div class="feed-list">
      <PostItem
        v-for="post in displayPosts"
        :key="post.id"
        :post="post"
        @read="handleRead"
      />
      <p v-if="!loading && displayPosts.length === 0" class="empty">No posts yet. Add sites and fetch!</p>
    </div>
  </div>
</template>

<style scoped>
.feed { max-width: 800px; margin: 0 auto; }
.feed-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #eee; }
.feed-header h1 { margin: 0; font-size: 20px; }
.feed-actions { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.feed-actions button { padding: 4px 12px; cursor: pointer; }
.feed-actions a { color: #0969da; text-decoration: none; }
.empty { text-align: center; color: #888; padding: 40px; }
</style>
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/
git commit -m "feat: add Vue Feed page with post list, site filter, and read tracking"
```

---

## Task 13: Vue Frontend — Settings Page

**Goal:** Build the settings page for managing sites and interests.

**Files:**
- Create: `packages/web/src/pages/Settings.vue`
- Create: `packages/web/src/components/InterestTag.vue`

**Dependencies:** Task 12

- [ ] **Step 1: Create InterestTag component**

`packages/web/src/components/InterestTag.vue`:
```vue
<script setup lang="ts">
defineProps<{
  interest: { id: string; keyword: string; weight: number; source: string };
}>();
const emit = defineEmits<{ remove: [id: string] }>();
</script>

<template>
  <span class="interest-tag" :class="interest.source">
    {{ interest.keyword }}
    <span class="weight">({{ interest.weight.toFixed(1) }})</span>
    <button class="remove" @click.stop="emit('remove', interest.id)">&times;</button>
  </span>
</template>

<style scoped>
.interest-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 12px; font-size: 13px;
  background: #e8f0fe; color: #1a73e8;
}
.interest-tag.learned { background: #fef3e0; color: #e67700; }
.weight { font-size: 11px; opacity: 0.7; }
.remove { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; padding: 0; }
.remove:hover { opacity: 1; }
</style>
```

- [ ] **Step 2: Create Settings page**

`packages/web/src/pages/Settings.vue`:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import InterestTag from '../components/InterestTag.vue';

const sites = ref<any[]>([]);
const interests = ref<any[]>([]);
const newKeyword = ref('');
const newSiteName = ref('');
const newSiteAdapter = ref('hackernews');

async function loadData() {
  sites.value = await api.sites.list();
  interests.value = await api.interests.list();
}

async function addInterest() {
  if (!newKeyword.value.trim()) return;
  await api.interests.add(newKeyword.value.trim());
  newKeyword.value = '';
  await loadData();
}

async function removeInterest(id: string) {
  await api.interests.remove(id);
  await loadData();
}

async function addSite() {
  if (!newSiteName.value.trim()) return;
  await api.sites.create({ name: newSiteName.value.trim(), adapter: newSiteAdapter.value });
  newSiteName.value = '';
  await loadData();
}

async function toggleSite(site: any) {
  await api.sites.update(site.id, { enabled: site.enabled ? 0 : 1 });
  await loadData();
}

async function deleteSite(id: string) {
  await api.sites.delete(id);
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="settings">
    <header class="settings-header">
      <router-link to="/">&larr; Back</router-link>
      <h1>Settings</h1>
    </header>

    <section class="section">
      <h2>Sites</h2>
      <div class="site-list">
        <div v-for="site in sites" :key="site.id" class="site-row">
          <span class="site-name">{{ site.name }}</span>
          <span class="site-adapter">{{ site.adapter }}</span>
          <button @click="toggleSite(site)">{{ site.enabled ? 'Disable' : 'Enable' }}</button>
          <button class="danger" @click="deleteSite(site.id)">Delete</button>
        </div>
      </div>
      <div class="add-form">
        <input v-model="newSiteName" placeholder="Site name" />
        <select v-model="newSiteAdapter">
          <option value="hackernews">Hacker News</option>
          <option value="reddit">Reddit</option>
          <option value="v2ex">V2EX</option>
          <option value="medium">Medium</option>
        </select>
        <button @click="addSite">Add Site</button>
      </div>
    </section>

    <section class="section">
      <h2>Interests</h2>
      <div class="interests-list">
        <InterestTag
          v-for="interest in interests"
          :key="interest.id"
          :interest="interest"
          @remove="removeInterest"
        />
      </div>
      <div class="add-form">
        <input v-model="newKeyword" placeholder="Add keyword..." @keydown.enter="addInterest" />
        <button @click="addInterest">Add</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings { max-width: 800px; margin: 0 auto; padding: 16px; }
.settings-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.settings-header a { color: #0969da; text-decoration: none; }
.settings-header h1 { margin: 0; }
.section { margin-bottom: 32px; }
.section h2 { font-size: 16px; margin-bottom: 12px; }
.site-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; }
.site-name { font-weight: 500; flex: 1; }
.site-adapter { font-size: 12px; color: #666; }
.add-form { display: flex; gap: 8px; margin-top: 12px; }
.add-form input { flex: 1; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; }
.add-form button { padding: 6px 16px; cursor: pointer; }
.interests-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.danger { color: #d32f2f; }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/pages/Settings.vue packages/web/src/components/InterestTag.vue
git commit -m "feat: add Settings page with site and interest management"
```

---

## Task 14: Agent Skills

**Goal:** Create all 6 Agent Skill definitions.

**Files:**
- Create: `skills/devpulse-start.md`
- Create: `skills/devpulse-stop.md`
- Create: `skills/devpulse-fetch.md`
- Create: `skills/devpulse-add-site.md`
- Create: `skills/devpulse-interests.md`
- Create: `skills/devpulse-status.md`

**Dependencies:** Task 11

- [ ] **Step 1: Create devpulse-start skill**

`skills/devpulse-start.md`:
```markdown
---
name: devpulse-start
description: Start the DevPulse server (API + Web UI)
---

Start the DevPulse development hotspot aggregator server.

## Steps

1. Check if a DevPulse server is already running:
   ```bash
   lsof -i :3377 2>/dev/null
   ```

2. If not running, start the server:
   ```bash
   cd <project-root>/packages/web && pnpm start &
   ```

3. Wait for startup and confirm:
   ```bash
   sleep 2 && curl -s http://localhost:3377/api/sites | head -c 100
   ```

4. Report to user: "DevPulse is running at http://localhost:3377"
```

- [ ] **Step 2: Create devpulse-stop skill**

`skills/devpulse-stop.md`:
```markdown
---
name: devpulse-stop
description: Stop the DevPulse server
---

Stop the running DevPulse server.

## Steps

1. Find the server process:
   ```bash
   lsof -ti :3377
   ```

2. Kill the process:
   ```bash
   kill $(lsof -ti :3377)
   ```

3. Confirm: "DevPulse server stopped."
```

- [ ] **Step 3: Create devpulse-fetch skill**

`skills/devpulse-fetch.md`:
```markdown
---
name: devpulse-fetch
description: Manually trigger content fetch from all or specific sites
---

Trigger a manual content fetch from configured sites.

## Arguments

- No args: fetch from all enabled sites
- Site name: fetch from a specific site (e.g., `/devpulse-fetch hackernews`)

## Steps

1. Call the fetch API:
   ```bash
   curl -s -X POST http://localhost:3377/api/fetch \
     -H 'Content-Type: application/json' \
     -d '{}' # or {"siteId": "<id>"} for specific site
   ```

2. If a site name is given as argument, first look up the site ID:
   ```bash
   curl -s http://localhost:3377/api/sites
   ```
   Then pass the matching `siteId` in the fetch request body.

3. Report results: "Fetch complete. Check http://localhost:3377 for new posts."
```

- [ ] **Step 4: Create devpulse-add-site skill**

`skills/devpulse-add-site.md`:
```markdown
---
name: devpulse-add-site
description: Add a new site to DevPulse
---

Interactively add a new site to the DevPulse aggregator.

## Steps

1. Ask the user which adapter to use:
   - `hackernews` — Hacker News (no config needed)
   - `reddit` — Reddit (needs: subreddit name)
   - `v2ex` — V2EX (optional: API token)
   - `medium` — Medium (needs: RSS feed URL)

2. Ask for a display name and any required config.

3. Create the site via API:
   ```bash
   curl -s -X POST http://localhost:3377/api/sites \
     -H 'Content-Type: application/json' \
     -d '{"name":"<name>","adapter":"<adapter>","config":{"key":"value"}}'
   ```

4. Confirm creation and offer to trigger an immediate fetch.
```

- [ ] **Step 5: Create devpulse-interests skill**

`skills/devpulse-interests.md`:
```markdown
---
name: devpulse-interests
description: View and manage interest keywords for AI recommendations
---

Manage the interest keywords that drive AI-powered content recommendations.

## Steps

1. Fetch current interests:
   ```bash
   curl -s http://localhost:3377/api/interests
   ```

2. Display them in a table showing keyword, weight, and source (manual/learned).

3. Ask the user what they'd like to do:
   - **Add**: POST new keyword
   - **Remove**: DELETE by id
   - **Done**: exit

4. For additions:
   ```bash
   curl -s -X POST http://localhost:3377/api/interests \
     -H 'Content-Type: application/json' \
     -d '{"keyword":"<keyword>"}'
   ```
```

- [ ] **Step 6: Create devpulse-status skill**

`skills/devpulse-status.md`:
```markdown
---
name: devpulse-status
description: Check DevPulse server status and site fetch times
---

Show the current status of the DevPulse server and configured sites.

## Steps

1. Check if server is running:
   ```bash
   curl -sf http://localhost:3377/api/sites > /dev/null 2>&1 && echo "running" || echo "stopped"
   ```

2. If running, fetch site list:
   ```bash
   curl -s http://localhost:3377/api/sites
   ```

3. Display a status table:
   - Server: running/stopped
   - URL: http://localhost:3377
   - For each site: name, adapter, enabled, last fetched time, fetch interval
```

- [ ] **Step 7: Commit**

```bash
git add skills/
git commit -m "feat: add 6 Agent Skill definitions for DevPulse"
```

---

## Task 15: Database Migration Script

**Goal:** Create a migration script that initializes the SQLite database on first run.

**Files:**
- Create: `packages/core/src/db/migrate.ts`

**Dependencies:** Task 2

- [ ] **Step 1: Implement migrate.ts**

`packages/core/src/db/migrate.ts`:
```typescript
import Database from 'better-sqlite3';

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  adapter TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  fetch_interval INTEGER NOT NULL DEFAULT 60,
  last_fetched_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS site_configs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(site_id, key)
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  author TEXT,
  score INTEGER DEFAULT 0,
  ai_score REAL,
  ai_reason TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(site_id, external_id)
);
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(post_id, tag_id)
);
CREATE TABLE IF NOT EXISTS read_history (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE REFERENCES posts(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  weight REAL NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL CHECK(source IN ('manual','learned')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function migrate(dbPath: string) {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(CREATE_TABLES_SQL);
  sqlite.close();
}
```

- [ ] **Step 2: Wire migration into server start**

Update `packages/web/server/start.ts` to call `migrate(DB_PATH)` before `buildApp`:

Add this import and call at the top of `main()`:
```typescript
import { migrate } from '@devpulse/core';

// In main(), before buildApp:
migrate(DB_PATH);
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/db/migrate.ts packages/web/server/start.ts
git commit -m "feat: add database migration script for first-run initialization"
```

---

## Task 16: Integration Test — End-to-End Flow

**Goal:** Verify the full flow: add site → fetch → score → list posts.

**Files:**
- Create: `packages/core/tests/integration.test.ts`

**Dependencies:** Tasks 2-10

- [ ] **Step 1: Write integration test**

`packages/core/tests/integration.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestDb } from './test-helpers.js';
import { SiteService } from '../src/services/site.service.js';
import { PostService } from '../src/services/post.service.js';
import { InterestService } from '../src/services/interest.service.js';
import { FetcherService } from '../src/services/fetcher.service.js';
import type { AiService } from '../src/services/ai.service.js';
import type { Adapter } from '../src/adapters/adapter.interface.js';

describe('Integration: Full fetch-to-read flow', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;

  beforeEach(() => ({ db, sqlite } = createTestDb()));
  afterEach(() => sqlite.close());

  it('should add site, fetch posts, score, filter unread', async () => {
    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);

    // Add interests
    interestService.add('Rust', 'manual');
    interestService.add('AI', 'manual');

    // Mock adapter
    const mockAdapter: Adapter = {
      name: 'test', displayName: 'Test',
      async fetchPosts() {
        return [
          { externalId: '1', title: 'Rust in Production', url: 'http://a', score: 200, author: 'dev1' },
          { externalId: '2', title: 'New AI Model', url: 'http://b', score: 150, author: 'dev2' },
          { externalId: '3', title: 'CSS Tricks', url: 'http://c', score: 50, author: 'dev3' },
        ];
      },
    };

    // Mock AI
    const mockAi = {
      scorePosts: vi.fn().mockResolvedValue([
        { index: 0, score: 0.95, tags: ['Rust', 'Systems'], reason: 'Directly about Rust' },
        { index: 1, score: 0.85, tags: ['AI', 'ML'], reason: 'AI related' },
        { index: 2, score: 0.2, tags: ['CSS', 'Frontend'], reason: 'Not in interests' },
      ]),
    } as unknown as AiService;

    const fetcher = new FetcherService(postService, siteService, interestService, mockAi, () => mockAdapter);

    // Create site and fetch
    const site = siteService.create({ name: 'Test Site', adapter: 'test' });
    await fetcher.fetchSite(site.id);

    // Verify posts exist with AI scores
    const allPosts = postService.list({ sortBy: 'score' });
    expect(allPosts).toHaveLength(3);
    expect(allPosts[0].title).toBe('Rust in Production'); // highest combined score
    expect(allPosts[0].aiScore).toBe(0.95);

    // Mark first as read
    postService.markAsRead(allPosts[0].id);

    // Verify unread filter
    const unread = postService.list({ unreadOnly: true });
    expect(unread).toHaveLength(2);

    // Verify interest boost happened
    expect(mockAi.scorePosts).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `cd packages/core && pnpm vitest run tests/integration.test.ts`
Expected: PASS.

- [ ] **Step 3: Run all tests**

Run: `cd packages/core && pnpm vitest run`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/tests/integration.test.ts
git commit -m "test: add end-to-end integration test for full fetch-score-read flow"
```

---

## Summary

| Task | Description | Dependencies |
|------|------------|-------------|
| 1 | Project scaffolding | None |
| 2 | Database schema & connection | 1 |
| 3 | Site service | 2 |
| 4 | Adapter interface & HN adapter | 1 |
| 5 | Reddit, V2ex, Medium adapters | 4 |
| 6 | Post service | 2 |
| 7 | AI service | 2 |
| 8 | Interest service | 2 |
| 9 | Fetcher service | 3, 4, 6, 7, 8 |
| 10 | Core package exports | 2-9 |
| 11 | Fastify API server | 10 |
| 12 | Vue Feed page | 11 |
| 13 | Vue Settings page | 12 |
| 14 | Agent Skills | 11 |
| 15 | Database migration | 2 |
| 16 | Integration test | 2-10 |

**Parallelizable groups:**
- Tasks 3, 4, 6, 7, 8, 15 can all run in parallel (only depend on Task 2)
- Tasks 5 depends on 4 only
- Tasks 12, 14 can run in parallel (both depend on 11)
