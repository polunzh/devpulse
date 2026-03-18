import { Hono } from 'hono';
import type { Env, AppServices } from '../index.js';

type Variables = { services: AppServices };

export const sitesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

sitesRoutes.get('/sites', async (c) => {
  return c.json(await c.var.services.siteService.listAll());
});

sitesRoutes.post('/sites', async (c) => {
  const { name, adapter, config } = await c.req.json();
  const site = await c.var.services.siteService.create({ name, adapter });
  if (config) {
    for (const [key, value] of Object.entries(config)) {
      await c.var.services.siteService.setConfig(site.id, key, value as string);
    }
  }
  return c.json(site);
});

sitesRoutes.put('/sites/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  await c.var.services.siteService.update(id, body);
  return c.json(await c.var.services.siteService.getById(id));
});

sitesRoutes.delete('/sites/:id', async (c) => {
  await c.var.services.siteService.delete(c.req.param('id'));
  return c.json({ ok: true });
});

sitesRoutes.get('/sites/:id/config', async (c) => {
  return c.json(await c.var.services.siteService.getConfigs(c.req.param('id')));
});

sitesRoutes.put('/sites/:id/config', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  for (const [key, value] of Object.entries(body)) {
    await c.var.services.siteService.setConfig(id, key, value as string);
  }
  return c.json(await c.var.services.siteService.getConfigs(id));
});
