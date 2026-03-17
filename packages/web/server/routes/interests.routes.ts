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
