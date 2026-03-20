import type { FastifyPluginAsync } from 'fastify';
import { getAllAdapters } from '@devpulse/core';

export const adaptersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/adapters', async () => {
    return getAllAdapters().map(a => ({
      name: a.name,
      displayName: a.displayName,
      configSchema: a.configSchema || [],
    }));
  });
};
