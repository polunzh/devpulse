import { Hono } from 'hono';
import type { Env, AppServices } from '../index.js';

type Variables = { services: AppServices };

export const postsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

postsRoutes.get('/posts', async (c) => {
  const { siteId, unreadOnly, sortBy, limit, offset } = c.req.query();
  const posts = await c.var.services.postService.list({
    siteId,
    unreadOnly: unreadOnly === 'true',
    sortBy: (sortBy as 'score' | 'time') || 'score',
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  });
  return c.json(posts);
});

postsRoutes.post('/posts/:id/read', async (c) => {
  const { id } = c.req.param();
  await c.var.services.postService.markAsRead(id);
  const postTags = await c.var.services.postService.getPostTags(id);
  if (postTags.length > 0) {
    await c.var.services.interestService.boostForTags(postTags);
  }
  return c.json({ ok: true });
});

postsRoutes.post('/posts/:id/ignore', async (c) => {
  const { id } = c.req.param();
  await c.var.services.postService.markAsIgnored(id);
  return c.json({ ok: true });
});
