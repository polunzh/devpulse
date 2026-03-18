import { Hono } from 'hono';
import type { Env, AppServices } from '../index.js';

type Variables = { services: AppServices };

export const interestsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

interestsRoutes.get('/interests', async (c) => {
  return c.json(await c.var.services.interestService.listAll());
});

interestsRoutes.post('/interests', async (c) => {
  const { keyword } = await c.req.json();
  return c.json(await c.var.services.interestService.add(keyword, 'manual'));
});

interestsRoutes.delete('/interests/:id', async (c) => {
  await c.var.services.interestService.remove(c.req.param('id'));
  return c.json({ ok: true });
});
