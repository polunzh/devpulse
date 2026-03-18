import { Hono } from 'hono';
import type { Env, AppServices } from '../index.js';

type Variables = { services: AppServices };

export const fetchRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

fetchRoutes.post('/fetch', async (c) => {
  const { siteId } = await c.req.json();
  if (siteId) {
    await c.var.services.fetcherService.fetchSite(siteId);
  } else {
    await c.var.services.fetcherService.fetchAll();
  }
  return c.json({ ok: true });
});
