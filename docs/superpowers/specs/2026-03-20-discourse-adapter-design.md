# Discourse Adapter Design Spec

## Goal

Add a generic Discourse adapter so users can add any Discourse-based forum (e.g. linux.do, meta.discourse.org) as a data source in Settings.

Also: upgrade the Settings UI to render adapter-specific configuration fields dynamically based on `configSchema`, benefiting all adapters.

## Adapter: `DiscourseAdapter`

**File:** `packages/core/src/adapters/discourse.adapter.ts`

### Config Schema

| Key | Label | Type | Required | Default |
|-----|-------|------|----------|---------|
| `url` | Forum URL | text | yes | — |
| `mode` | Fetch mode | select | no | `latest` |
| `topPeriod` | Top period | select | no | `weekly` |
| `category` | Category slug | text | no | — |
| `limit` | Number of posts | number | no | `30` |

**Select field options:**
- `mode`: `Latest` (`latest`), `Top` (`top`)
- `topPeriod`: `Daily` (`daily`), `Weekly` (`weekly`), `Monthly` (`monthly`), `Yearly` (`yearly`), `All Time` (`all`)

> **Note:** `ConfigField.type` in `adapter.interface.ts` currently only supports `'text' | 'number'`. We need to add `'select'` with an `options` array. This is a minimal interface change.

### URL Normalization

The adapter must normalize the `url` config value:
- Strip trailing slashes
- Validate it starts with `http://` or `https://`
- On first fetch, call `GET {url}/site.json` to verify it's a Discourse instance

### API Endpoints Used

- `GET {url}/latest.json?page=0` — latest topics
- `GET {url}/top.json?period={topPeriod}` — top topics by period
- `GET {url}/c/{category}/{categoryId}.json` — topics in a category (requires a preliminary lookup of `GET {url}/categories.json` to resolve slug → id)
- Category + top combined: `GET {url}/c/{slug}/{id}/l/top.json?period={topPeriod}`

All endpoints are public on Discourse forums with default settings. No auth needed.

**Category resolution:** When `category` is set, resolve slug → id via `GET {url}/categories.json` on first fetch. Cache the resolved `categoryId` in site config to avoid repeated lookups. If category has no topics, return empty array (not an error).

### Data Mapping

Discourse `/latest.json` returns `{ topic_list: { topics: [...] } }` where each topic has:

```
topic.id          → externalId (string)
topic.title       → title
topic.excerpt     → summary (may be absent; fallback to empty)
{url}/t/{slug}/{id} → url
topic.posters[0].user_id → match against response `users` array by `id`, use `username` as author
topic.like_count + topic.reply_count → score
topic.created_at  → publishedAt
```

### Error Handling

- Invalid URL or unreachable site: throw with descriptive message
- Non-Discourse site (unexpected JSON shape): throw "Not a valid Discourse site"
- Category slug not found: throw "Category '{slug}' not found"

## Interface Change: `ConfigField`

**File:** `packages/core/src/adapters/adapter.interface.ts`

Add `select` type with options:

```typescript
export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];  // for select type
}
```

This is backwards-compatible — existing adapters use `text`/`number` only.

## Settings UI: Dynamic Config Form

**File:** `packages/web/src/pages/Settings.vue`

### Current Behavior
- Adapter dropdown is hardcoded: `hackernews | reddit | v2ex | medium`
- No adapter-specific config fields shown

### New Behavior

1. **Adapter list from API**: Add a new API endpoint `GET /api/adapters` that returns `getAllAdapters()` with their `name`, `displayName`, and `configSchema`. The dropdown populates from this.

2. **Dynamic config fields**: When an adapter is selected in the "Add Site" form, render its `configSchema` fields below the dropdown:
   - `text` → `<input type="text">`
   - `number` → `<input type="number">`
   - `select` → `<select>` with `options`
   - Required fields get a `*` indicator

3. **Config saved on create**: The existing `POST /sites` endpoint already accepts a `config` object in the body. Pass config inline: `api.sites.create({ name, adapter, config: { url, mode, ... } })`. No separate updateConfig call needed.

4. **Edit site config**: Each site row gains a "Configure" button that expands an inline form showing the adapter's config fields pre-filled with current values from `api.sites.getConfig()`.

### API Addition

**Worker route:** `GET /api/adapters` (in `packages/worker/src/index.ts`)
**Web server route:** `GET /api/adapters` (in `packages/web/server/app.ts`)

The route handler must explicitly map adapter objects to safe fields only (not serialize full adapter instances):

```json
[
  {
    "name": "hackernews",
    "displayName": "Hacker News",
    "configSchema": [...]
  },
  ...
]
```

**API client addition** (`packages/web/src/api/client.ts`):
```typescript
adapters: {
  list: () => request<AdapterInfo[]>('/adapters'),
},
```

**UI note:** If an adapter has no `configSchema` (undefined or empty), show "No configuration needed" instead of an empty form.

## Registration

**File:** `packages/core/src/adapters/index.ts`

Add:
```typescript
import { DiscourseAdapter } from './discourse.adapter.js';
register(new DiscourseAdapter());
```

## Scope

**In scope:**
- `DiscourseAdapter` implementation
- `ConfigField` interface update (add `select` type)
- Adapter list API endpoint
- Settings UI: dynamic adapter dropdown + config form + edit config
- API client update for new endpoint

**Out of scope:**
- Auth / API key support
- Category auto-complete / browsing
- Discourse notification or message integration
