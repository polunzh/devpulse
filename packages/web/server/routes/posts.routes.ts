import type { FastifyPluginAsync } from 'fastify';

export const postsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/posts', async (req) => {
    const { siteId, unreadOnly, sortBy, limit, offset } = req.query as any;
    return await app.services.postService.list({
      siteId,
      unreadOnly: unreadOnly === 'true',
      sortBy: sortBy || 'score',
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  });

  app.post<{ Params: { id: string } }>('/posts/:id/read', async (req) => {
    await app.services.postService.markAsRead(req.params.id);

    const postTags = await app.services.postService.getPostTags(req.params.id);
    if (postTags.length > 0) {
      await app.services.interestService.boostForTags(postTags);
    }
    return { ok: true };
  });
};
