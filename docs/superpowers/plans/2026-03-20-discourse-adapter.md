# Discourse Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generic Discourse forum adapter and upgrade Settings UI to dynamically render adapter config forms.

**Architecture:** New `DiscourseAdapter` follows existing adapter pattern (implements `Adapter` interface, registered in adapter registry). `ConfigField` interface extended with `select` type. New `GET /api/adapters` endpoint serves adapter metadata. Settings UI upgraded to use dynamic adapter list and render per-adapter config forms.

**Tech Stack:** TypeScript, Vitest, Vue 3, Hono (worker), Fastify (web server)

**Spec:** `docs/superpowers/specs/2026-03-20-discourse-adapter-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `packages/core/src/adapters/adapter.interface.ts` | Add `select` type and `options` to `ConfigField` |
| Create | `packages/core/src/adapters/discourse.adapter.ts` | Discourse adapter implementation |
| Modify | `packages/core/src/adapters/index.ts` | Register Discourse adapter |
| Modify | `packages/core/src/index.ts` | Export (already exports `getAllAdapters`, no change needed) |
| Create | `packages/core/tests/adapters/discourse.test.ts` | Adapter unit tests |
| Modify | `packages/core/tests/adapters/registry.test.ts` | Update registry test for new adapter |
| Create | `packages/worker/src/routes/adapters.ts` | Worker adapters route |
| Modify | `packages/worker/src/index.ts` | Register adapters route |
| Create | `packages/web/server/routes/adapters.routes.ts` | Fastify adapters route |
| Modify | `packages/web/server/app.ts` | Register adapters route |
| Modify | `packages/web/src/api/client.ts` | Add `adapters.list()` API method |
| Modify | `packages/web/src/pages/Settings.vue` | Dynamic adapter dropdown + config forms |

---

### Task 1: Extend ConfigField Interface

**Files:**
- Modify: `packages/core/src/adapters/adapter.interface.ts:15-21`

- [ ] **Step 1: Update ConfigField type**

Add `'select'` to the type union and add optional `options` field:

```typescript
export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}
```

- [ ] **Step 2: Run tests to verify nothing breaks**

Run: `cd packages/core && npx vitest run`
Expected: All existing tests pass (backwards-compatible change)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/adapters/adapter.interface.ts
git commit -m "feat: add select type to ConfigField interface"
```

---

### Task 2: Implement DiscourseAdapter

**Files:**
- Create: `packages/core/src/adapters/discourse.adapter.ts`
- Create: `packages/core/tests/adapters/discourse.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/tests/adapters/discourse.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscourseAdapter } from '../../src/adapters/discourse.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('DiscourseAdapter', () => {
  const adapter = new DiscourseAdapter();
  beforeEach(() => mockFetch.mockReset());

  it('should have correct name and displayName', () => {
    expect(adapter.name).toBe('discourse');
    expect(adapter.displayName).toBe('Discourse');
  });

  it('should have configSchema with url, mode, topPeriod, category, limit', () => {
    const keys = adapter.configSchema!.map(f => f.key);
    expect(keys).toEqual(['url', 'mode', 'topPeriod', 'category', 'limit']);
    // url is required
    expect(adapter.configSchema!.find(f => f.key === 'url')!.required).toBe(true);
    // mode is select with options
    const mode = adapter.configSchema!.find(f => f.key === 'mode')!;
    expect(mode.type).toBe('select');
    expect(mode.options).toEqual([
      { label: 'Latest', value: 'latest' },
      { label: 'Top', value: 'top' },
    ]);
  });

  it('should normalize URL by stripping trailing slash', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics: [] }, users: [] }),
    });

    await adapter.fetchPosts({ url: 'https://linux.do/' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/latest.json?page=0',
      expect.any(Object),
    );
  });

  it('should fetch latest topics and map to RawPost', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: [{ id: 1, username: 'alice' }],
        topic_list: {
          topics: [{
            id: 42,
            title: 'Hello Discourse',
            slug: 'hello-discourse',
            excerpt: 'A sample topic',
            like_count: 10,
            reply_count: 5,
            created_at: '2026-03-20T10:00:00.000Z',
            posters: [{ user_id: 1 }],
          }],
        },
      }),
    });

    const posts = await adapter.fetchPosts({ url: 'https://linux.do' });
    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      externalId: '42',
      title: 'Hello Discourse',
      summary: 'A sample topic',
      url: 'https://linux.do/t/hello-discourse/42',
      author: 'alice',
      score: 15,
      publishedAt: new Date('2026-03-20T10:00:00.000Z'),
    });
  });

  it('should fetch top topics when mode is top', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics: [] }, users: [] }),
    });

    await adapter.fetchPosts({ url: 'https://linux.do', mode: 'top', topPeriod: 'monthly' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/top.json?period=monthly',
      expect.any(Object),
    );
  });

  it('should fetch category topics with slug resolution', async () => {
    // First call: categories lookup
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        category_list: {
          categories: [{ id: 7, slug: 'dev' }],
        },
      }),
    });
    // Second call: category topics
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics: [] }, users: [] }),
    });

    await adapter.fetchPosts({ url: 'https://linux.do', category: 'dev' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/categories.json',
      expect.any(Object),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/c/dev/7.json',
      expect.any(Object),
    );
  });

  it('should throw when category slug is not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        category_list: { categories: [{ id: 1, slug: 'other' }] },
      }),
    });

    await expect(adapter.fetchPosts({ url: 'https://linux.do', category: 'nonexistent' }))
      .rejects.toThrow("Category 'nonexistent' not found");
  });

  it('should throw on invalid URL protocol', async () => {
    await expect(adapter.fetchPosts({ url: 'ftp://linux.do' }))
      .rejects.toThrow('URL must start with http:// or https://');
  });

  it('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(adapter.fetchPosts({ url: 'https://linux.do' }))
      .rejects.toThrow();
  });

  it('should respect limit config', async () => {
    const topics = Array.from({ length: 50 }, (_, i) => ({
      id: i, title: `T${i}`, slug: `t-${i}`, like_count: 0, reply_count: 0,
      created_at: '2026-01-01T00:00:00Z', posters: [],
    }));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics }, users: [] }),
    });

    const posts = await adapter.fetchPosts({ url: 'https://linux.do', limit: '10' });
    expect(posts).toHaveLength(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run tests/adapters/discourse.test.ts`
Expected: FAIL — `discourse.adapter.js` module not found

- [ ] **Step 3: Write the DiscourseAdapter implementation**

Create `packages/core/src/adapters/discourse.adapter.ts`:

```typescript
import type { Adapter, RawPost, SiteConfig, ConfigField } from './adapter.interface.js';

interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  posters: { user_id: number }[];
}

interface DiscourseUser {
  id: number;
  username: string;
}

export class DiscourseAdapter implements Adapter {
  name = 'discourse';
  displayName = 'Discourse';

  configSchema: ConfigField[] = [
    { key: 'url', label: 'Forum URL', type: 'text', required: true },
    {
      key: 'mode', label: 'Fetch mode', type: 'select', defaultValue: 'latest',
      options: [
        { label: 'Latest', value: 'latest' },
        { label: 'Top', value: 'top' },
      ],
    },
    {
      key: 'topPeriod', label: 'Top period', type: 'select', defaultValue: 'weekly',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'All Time', value: 'all' },
      ],
    },
    { key: 'category', label: 'Category slug (optional)', type: 'text' },
    { key: 'limit', label: 'Number of posts', type: 'number', defaultValue: '30' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const baseUrl = (config.url || '').replace(/\/+$/, '');
    if (!baseUrl) throw new Error('Discourse URL is required');
    if (!/^https?:\/\//.test(baseUrl)) throw new Error('URL must start with http:// or https://');

    const mode = config.mode || 'latest';
    const topPeriod = config.topPeriod || 'weekly';
    const category = config.category || '';
    const limit = parseInt(config.limit || '30', 10);

    let apiUrl: string;

    if (category) {
      const categoryId = await this.resolveCategoryId(baseUrl, category);
      if (mode === 'top') {
        apiUrl = `${baseUrl}/c/${category}/${categoryId}/l/top.json?period=${topPeriod}`;
      } else {
        apiUrl = `${baseUrl}/c/${category}/${categoryId}.json`;
      }
    } else if (mode === 'top') {
      apiUrl = `${baseUrl}/top.json?period=${topPeriod}`;
    } else {
      apiUrl = `${baseUrl}/latest.json?page=0`;
    }

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Discourse API error: ${res.status}`);

    const json = await res.json() as {
      topic_list: { topics: DiscourseTopic[] };
      users: DiscourseUser[];
    };

    const users = new Map((json.users || []).map(u => [u.id, u.username]));
    const topics = (json.topic_list?.topics || []).slice(0, limit);

    return topics.map((t) => ({
      externalId: String(t.id),
      title: t.title,
      summary: t.excerpt || undefined,
      url: `${baseUrl}/t/${t.slug}/${t.id}`,
      author: t.posters?.[0] ? users.get(t.posters[0].user_id) : undefined,
      score: (t.like_count || 0) + (t.reply_count || 0),
      publishedAt: new Date(t.created_at),
    }));
  }

  private async resolveCategoryId(baseUrl: string, slug: string): Promise<number> {
    const res = await fetch(`${baseUrl}/categories.json`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);

    const json = await res.json() as {
      category_list: { categories: { id: number; slug: string }[] };
    };
    const cat = json.category_list.categories.find(c => c.slug === slug);
    if (!cat) throw new Error(`Category '${slug}' not found`);
    return cat.id;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run tests/adapters/discourse.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/adapters/discourse.adapter.ts packages/core/tests/adapters/discourse.test.ts
git commit -m "feat: add Discourse adapter with tests"
```

---

### Task 3: Register Adapter and Update Registry Test

**Files:**
- Modify: `packages/core/src/adapters/index.ts`
- Modify: `packages/core/tests/adapters/registry.test.ts`

- [ ] **Step 1: Register the adapter**

In `packages/core/src/adapters/index.ts`, add:

```typescript
import { DiscourseAdapter } from './discourse.adapter.js';
```

And after the existing `register()` calls:

```typescript
register(new DiscourseAdapter());
```

- [ ] **Step 2: Update registry test**

In `packages/core/tests/adapters/registry.test.ts`, update the `'should list all registered adapters'` test:

```typescript
it('should list all registered adapters', () => {
  const all = getAllAdapters();
  expect(all.length).toBeGreaterThanOrEqual(5);
  const names = all.map(a => a.name);
  expect(names).toContain('hackernews');
  expect(names).toContain('reddit');
  expect(names).toContain('v2ex');
  expect(names).toContain('medium');
  expect(names).toContain('discourse');
});
```

- [ ] **Step 3: Run all adapter tests**

Run: `cd packages/core && npx vitest run tests/adapters/`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/adapters/index.ts packages/core/tests/adapters/registry.test.ts
git commit -m "feat: register Discourse adapter in registry"
```

---

### Task 4: Add Adapters API Endpoint (Worker + Web Server)

**Files:**
- Create: `packages/worker/src/routes/adapters.ts`
- Modify: `packages/worker/src/index.ts`
- Create: `packages/web/server/routes/adapters.routes.ts`
- Modify: `packages/web/server/app.ts`

- [ ] **Step 1: Create Worker adapters route**

Create `packages/worker/src/routes/adapters.ts`:

```typescript
import { Hono } from 'hono';
import { getAllAdapters } from '@devpulse/core';
import type { Env, AppServices } from '../index.js';

type Variables = { services: AppServices };

export const adaptersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adaptersRoutes.get('/adapters', (c) => {
  const adapters = getAllAdapters().map(a => ({
    name: a.name,
    displayName: a.displayName,
    configSchema: a.configSchema || [],
  }));
  return c.json(adapters);
});
```

- [ ] **Step 2: Register route in Worker**

In `packages/worker/src/index.ts`, add import:

```typescript
import { adaptersRoutes } from './routes/adapters.js';
```

Add after existing route registrations:

```typescript
app.route('/api', adaptersRoutes);
```

- [ ] **Step 3: Create Fastify adapters route**

Create `packages/web/server/routes/adapters.routes.ts`:

```typescript
import type { FastifyPluginAsync } from 'fastify';
import { getAllAdapters } from '@devpulse/core';

export const adaptersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/adapters', async () => {
    return getAllAdapters().map(a => ({
      name: a.name,
      displayName: a.displayName,
      configSchema: a.configSchema || [],
    }));
  });
};
```

- [ ] **Step 4: Register route in Fastify app**

In `packages/web/server/app.ts`, add import:

```typescript
import { adaptersRoutes } from './routes/adapters.routes.js';
```

Add after existing route registrations:

```typescript
await app.register(adaptersRoutes, { prefix: '/api' });
```

- [ ] **Step 5: Commit**

```bash
git add packages/worker/src/routes/adapters.ts packages/worker/src/index.ts \
  packages/web/server/routes/adapters.routes.ts packages/web/server/app.ts
git commit -m "feat: add GET /api/adapters endpoint for both worker and web server"
```

---

### Task 5: Update API Client

**Files:**
- Modify: `packages/web/src/api/client.ts`

- [ ] **Step 1: Add adapters namespace to API client**

In `packages/web/src/api/client.ts`, add after the `fetch` block:

```typescript
adapters: {
  list: () => request<{ name: string; displayName: string; configSchema: any[] }[]>('/adapters'),
},
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/api/client.ts
git commit -m "feat: add adapters.list() to API client"
```

---

### Task 6: Upgrade Settings UI — Dynamic Adapter Dropdown + Config Form

**Files:**
- Modify: `packages/web/src/pages/Settings.vue`

- [ ] **Step 1: Update script section**

Replace the script section of `Settings.vue` with:

```typescript
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../api/client';
import InterestTag from '../components/InterestTag.vue';

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}

interface AdapterInfo {
  name: string;
  displayName: string;
  configSchema: ConfigField[];
}

const sites = ref<any[]>([]);
const interests = ref<any[]>([]);
const adapters = ref<AdapterInfo[]>([]);
const newKeyword = ref('');
const newSiteName = ref('');
const newSiteAdapter = ref('');
const newSiteConfig = ref<Record<string, string>>({});
const editingSiteId = ref<string | null>(null);
const editingConfig = ref<Record<string, string>>({});

const selectedAdapterSchema = computed(() => {
  return adapters.value.find(a => a.name === newSiteAdapter.value)?.configSchema || [];
});

const editingAdapterSchema = computed(() => {
  if (!editingSiteId.value) return [];
  const site = sites.value.find(s => s.id === editingSiteId.value);
  if (!site) return [];
  return adapters.value.find(a => a.name === site.adapter)?.configSchema || [];
});

watch(newSiteAdapter, () => {
  // Reset config with defaults when adapter changes
  const schema = selectedAdapterSchema.value;
  const config: Record<string, string> = {};
  for (const field of schema) {
    if (field.defaultValue) config[field.key] = field.defaultValue;
  }
  newSiteConfig.value = config;
});

async function loadData() {
  [sites.value, interests.value, adapters.value] = await Promise.all([
    api.sites.list(),
    api.interests.list(),
    api.adapters.list(),
  ]);
  if (!newSiteAdapter.value && adapters.value.length > 0) {
    newSiteAdapter.value = adapters.value[0].name;
  }
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
  // Filter out empty config values
  const config: Record<string, string> = {};
  for (const [k, v] of Object.entries(newSiteConfig.value)) {
    if (v) config[k] = v;
  }
  await api.sites.create({
    name: newSiteName.value.trim(),
    adapter: newSiteAdapter.value,
    config: Object.keys(config).length > 0 ? config : undefined,
  });
  newSiteName.value = '';
  newSiteConfig.value = {};
  await loadData();
}

async function toggleSite(site: any) {
  await api.sites.update(site.id, { enabled: site.enabled ? 0 : 1 });
  await loadData();
}

async function deleteSite(id: string) {
  if (!confirm('Are you sure you want to delete this site?')) return;
  await api.sites.delete(id);
  if (editingSiteId.value === id) editingSiteId.value = null;
  await loadData();
}

async function startEditing(siteId: string) {
  if (editingSiteId.value === siteId) {
    editingSiteId.value = null;
    return;
  }
  editingSiteId.value = siteId;
  const config = await api.sites.getConfig(siteId);
  // Merge schema defaults so select fields show meaningful values
  const schema = editingAdapterSchema.value;
  const merged: Record<string, string> = {};
  for (const field of schema) {
    if (field.defaultValue) merged[field.key] = field.defaultValue;
  }
  Object.assign(merged, config);
  editingConfig.value = merged;
}

async function saveConfig() {
  if (!editingSiteId.value) return;
  const config: Record<string, string> = {};
  for (const [k, v] of Object.entries(editingConfig.value)) {
    if (v) config[k] = v;
  }
  await api.sites.updateConfig(editingSiteId.value, config);
  editingSiteId.value = null;
  await loadData();
}

onMounted(loadData);
</script>
```

- [ ] **Step 2: Update template section**

Replace the template section with:

```html
<template>
  <div class="settings">
    <header class="settings-header">
      <router-link to="/">&larr; Back</router-link>
      <h1>Settings</h1>
    </header>

    <section class="section">
      <h2>Sites</h2>
      <div class="site-list">
        <div v-for="site in sites" :key="site.id" class="site-item">
          <div class="site-row">
            <span class="site-name">{{ site.name }}</span>
            <span class="site-adapter">{{ site.adapter }}</span>
            <button @click="startEditing(site.id)">{{ editingSiteId === site.id ? 'Cancel' : 'Configure' }}</button>
            <button @click="toggleSite(site)">{{ site.enabled ? 'Disable' : 'Enable' }}</button>
            <button class="danger" @click="deleteSite(site.id)">Delete</button>
          </div>
          <div v-if="editingSiteId === site.id" class="config-form">
            <template v-if="editingAdapterSchema.length > 0">
              <div v-for="field in editingAdapterSchema" :key="field.key" class="config-field">
                <label>{{ field.label }}<span v-if="field.required" class="required">*</span></label>
                <select v-if="field.type === 'select'" v-model="editingConfig[field.key]">
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input v-else :type="field.type" v-model="editingConfig[field.key]" :placeholder="field.defaultValue" />
              </div>
            </template>
            <p v-else class="empty-hint">No configuration needed.</p>
            <button class="save-btn" @click="saveConfig">Save</button>
          </div>
        </div>
      </div>
      <p v-if="sites.length === 0" class="empty-hint">No sites added yet. Add one below.</p>

      <div class="add-form">
        <input v-model="newSiteName" placeholder="Site name" />
        <select v-model="newSiteAdapter">
          <option v-for="a in adapters" :key="a.name" :value="a.name">{{ a.displayName }}</option>
        </select>
        <button @click="addSite">Add Site</button>
      </div>
      <div v-if="selectedAdapterSchema.length > 0" class="new-site-config">
        <div v-for="field in selectedAdapterSchema" :key="field.key" class="config-field">
          <label>{{ field.label }}<span v-if="field.required" class="required">*</span></label>
          <select v-if="field.type === 'select'" v-model="newSiteConfig[field.key]">
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input v-else :type="field.type" v-model="newSiteConfig[field.key]" :placeholder="field.defaultValue" />
        </div>
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
      <p v-if="interests.length === 0" class="empty-hint">No interests yet. Add keywords to personalize recommendations.</p>
      <div class="add-form">
        <input v-model="newKeyword" placeholder="Add keyword..." @keydown.enter="addInterest" />
        <button @click="addInterest">Add</button>
      </div>
    </section>
  </div>
</template>
```

- [ ] **Step 3: Update style section**

Append to the existing `<style scoped>` block (keep existing styles, add new ones):

```css
.site-item { border-bottom: 1px solid var(--color-border-light); }
.site-item:last-child { border-bottom: none; }
.config-form { padding: 12px 0 12px 16px; border-left: 2px solid var(--color-primary-light); margin: 8px 0; }
.config-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.config-field label { min-width: 140px; font-size: 13px; color: var(--color-text-secondary); }
.config-field input, .config-field select {
  flex: 1; padding: 6px 10px; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-surface); font-size: 13px;
}
.config-field input:focus, .config-field select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
.required { color: var(--color-error); margin-left: 2px; }
.save-btn {
  margin-top: 4px; padding: 6px 16px; border: none; border-radius: 6px;
  background: var(--color-primary); color: white; font-size: 13px; font-weight: 500; cursor: pointer;
}
.save-btn:hover { background: var(--color-primary-hover); }
.new-site-config { margin-top: 12px; padding: 12px; border: 1px dashed var(--color-border); border-radius: 8px; }
```

- [ ] **Step 4: Manual test**

Run: `cd /Users/zhenqiang/Documents/code/devpulse && pnpm start`

Verify:
1. Settings page loads with adapter dropdown showing all 5 adapters (including Discourse)
2. Selecting "Discourse" shows config fields (URL, mode, top period, category, limit)
3. Adding a Discourse site with URL works
4. "Configure" button on existing sites expands inline config form
5. Saving config persists values

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/pages/Settings.vue
git commit -m "feat: dynamic adapter config form in Settings UI"
```

---

### Task 7: Build & Full Test

- [ ] **Step 1: Run full test suite**

Run: `cd /Users/zhenqiang/Documents/code/devpulse && pnpm test`
Expected: All tests pass

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: Build succeeds without errors

- [ ] **Step 3: Commit if any fixes were needed**

---

### Task 8: Update README

- [ ] **Step 1: Update README.md and README.zh-CN.md**

Add Discourse to the list of supported data sources / adapters in both READMEs.

- [ ] **Step 2: Commit**

```bash
git add README.md README.zh-CN.md
git commit -m "docs: add Discourse adapter to README"
```
