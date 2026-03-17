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
