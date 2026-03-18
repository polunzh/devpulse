import type { FastifyPluginAsync } from 'fastify';

export const interestsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/interests', async () => {
    return await app.services.interestService.listAll();
  });

  app.post<{ Body: { keyword: string } }>('/interests', async (req) => {
    return await app.services.interestService.add(req.body.keyword, 'manual');
  });

  app.delete<{ Params: { id: string } }>('/interests/:id', async (req) => {
    await app.services.interestService.remove(req.params.id);
    return { ok: true };
  });
};
