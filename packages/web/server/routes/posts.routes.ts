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

    const postTags = app.services.postService.getPostTags(req.params.id);
    if (postTags.length > 0) {
      app.services.interestService.boostForTags(postTags);
    }
    return { ok: true };
  });
};
