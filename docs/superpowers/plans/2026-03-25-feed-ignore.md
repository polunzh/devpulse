# Feed Ignore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent "not interested" button that removes posts from the feed without opening them and keeps them hidden on future refreshes.

**Architecture:** Add a dedicated ignored-post persistence layer in the core schema and service, expose it through the posts API, and wire the feed UI to optimistically remove ignored rows. Keep ignore semantics separate from read tracking so interest learning remains accurate.

**Tech Stack:** Vue 3, Fastify, TypeScript, drizzle-orm, Vitest

---

### Task 1: Backend Ignore Persistence

**Files:**
- Modify: `packages/core/tests/services/post-extra.test.ts`
- Modify: `packages/core/src/db/schema.ts`
- Modify: `packages/core/src/services/post.service.ts`

- [ ] **Step 1: Write the failing test**

Add tests for:
- ignored posts are excluded from `list({})`
- repeated `markAsIgnored()` calls are idempotent

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @devpulse/core test -- post-extra.test.ts`
Expected: FAIL because ignore behavior is not implemented

- [ ] **Step 3: Write minimal implementation**

Add `ignored_history` and implement `markAsIgnored()` / `isIgnored()` plus filtering in `list()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @devpulse/core test -- post-extra.test.ts`
Expected: PASS

### Task 2: HTTP Ignore Endpoint

**Files:**
- Modify: `packages/web/server/routes/posts.routes.ts`
- Modify: `packages/web/src/api/client.ts`

- [ ] **Step 1: Add the API surface**

Add `POST /posts/:id/ignore` on the server and `api.posts.ignore(id)` on the client.

- [ ] **Step 2: Verify the backend still builds/tests**

Run: `pnpm --filter @devpulse/web test`
Expected: Existing server-related tests stay green, or report if no matching tests exist

### Task 3: Feed UI Ignore Action

**Files:**
- Modify: `packages/web/src/components/PostItem.vue`
- Modify: `packages/web/src/pages/Feed.vue`

- [ ] **Step 1: Write the failing behavior mentally against current UI**

Current UI has no ignore action and card clicks always open the post.

- [ ] **Step 2: Write minimal implementation**

Add a "Not interested" button, stop click propagation, animate the row out, call the ignore API, and restore on failure.

- [ ] **Step 3: Verify the behavior**

Run: `pnpm --filter @devpulse/web build`
Expected: PASS

### Task 4: Final Verification

**Files:**
- No additional file changes expected

- [ ] **Step 1: Run targeted tests**

Run:
- `pnpm --filter @devpulse/core test -- post.test.ts post-extra.test.ts`
- `pnpm --filter @devpulse/web build`

Expected: PASS

- [ ] **Step 2: Review UX edge cases**

Confirm:
- ignore button does not open the article
- ignored post disappears immediately
- refresh does not bring ignored posts back
