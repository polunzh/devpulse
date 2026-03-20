import { Hono } from 'hono';
import { getAllAdapters } from '@devpulse/core';
import type { Env, AppServices } from '../index.js';

type Variables = { services: AppServices };

export const adaptersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adaptersRoutes.get('/adapters', (c) => {
  const adapters = getAllAdapters().map(a => ({
    name: a.name,
    displayName: a.displayName,
    configSchema: a.configSchema || [],
  }));
  return c.json(adapters);
});
