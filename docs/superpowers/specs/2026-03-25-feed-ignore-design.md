# Feed Ignore Design

**Goal:** Add a persistent "not interested" action so a post can be removed from the feed without opening it, and stay hidden on later refreshes.

## Architecture

Introduce a dedicated ignore state instead of reusing read history. This keeps "already opened" and "explicitly dismissed" separate, and avoids boosting user interests for content the user rejected.

Persist ignored posts in a new `ignored_history` table keyed by `postId`. The post listing path will exclude ignored posts by default. The feed UI will expose a secondary action on each post card that immediately animates the item out and calls a new ignore endpoint.

## Components

- `packages/core/src/db/schema.ts`
  Define `ignored_history`.
- `packages/core/src/services/post.service.ts`
  Exclude ignored posts from `list()` and add ignore helpers.
- `packages/web/server/routes/posts.routes.ts`
  Add `POST /posts/:id/ignore`.
- `packages/web/src/api/client.ts`
  Add ignore client call.
- `packages/web/src/pages/Feed.vue`
  Handle optimistic ignore removal and error recovery.
- `packages/web/src/components/PostItem.vue`
  Render the "Not interested" button without triggering open.

## Data Flow

1. User clicks "Not interested" on a post card.
2. Frontend stops the card click, marks the row as exiting, and removes it from the current list after the animation.
3. Frontend sends `POST /posts/:id/ignore`.
4. Backend stores the `postId` in `ignored_history`.
5. Later `GET /posts` calls exclude ignored posts automatically.

## Error Handling

- If the ignore request fails, restore the post in the feed and surface a lightweight error bar.
- Repeated ignore requests should be idempotent.
- Ignoring a post must not update read history or interest weights.

## Testing

- Service tests cover ignored posts being excluded from default listings.
- Service tests cover repeated ignore calls staying safe.
- Frontend verification covers the button not opening the article and the row disappearing immediately.
