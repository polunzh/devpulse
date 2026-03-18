import type { FastifyPluginAsync } from 'fastify';

export const sitesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/sites', async () => {
    return await app.services.siteService.listAll();
  });

  app.post<{ Body: { name: string; adapter: string; config?: Record<string, string> } }>('/sites', async (req) => {
    const { name, adapter, config } = req.body;
    const site = await app.services.siteService.create({ name, adapter });
    if (config) {
      for (const [key, value] of Object.entries(config)) {
        await app.services.siteService.setConfig(site.id, key, value);
      }
    }
    return site;
  });

  app.put<{ Params: { id: string }; Body: { enabled?: number; fetchInterval?: number } }>('/sites/:id', async (req) => {
    await app.services.siteService.update(req.params.id, req.body);
    return await app.services.siteService.getById(req.params.id);
  });

  app.delete<{ Params: { id: string } }>('/sites/:id', async (req) => {
    await app.services.siteService.delete(req.params.id);
    return { ok: true };
  });

  app.get<{ Params: { id: string } }>('/sites/:id/config', async (req) => {
    return await app.services.siteService.getConfigs(req.params.id);
  });

  app.put<{ Params: { id: string }; Body: Record<string, string> }>('/sites/:id/config', async (req) => {
    for (const [key, value] of Object.entries(req.body)) {
      await app.services.siteService.setConfig(req.params.id, key, value);
    }
    return await app.services.siteService.getConfigs(req.params.id);
  });
};
