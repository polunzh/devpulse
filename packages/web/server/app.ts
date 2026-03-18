import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createDb, SiteService, PostService, AiService, InterestService, FetcherService, getAdapter } from '@devpulse/core';
import { postsRoutes } from './routes/posts.routes.js';
import { sitesRoutes } from './routes/sites.routes.js';
import { interestsRoutes } from './routes/interests.routes.js';
import { fetchRoutes } from './routes/fetch.routes.js';

export interface AppServices {
  siteService: SiteService;
  postService: PostService;
  aiService: AiService | null;
  interestService: InterestService;
  fetcherService: FetcherService;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: AppServices;
  }
}

export async function buildApp(dbPath: string) {
  const app = Fastify({ logger: true });

  await app.register(cors);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const distPath = resolve(__dirname, '..', 'dist');
  try {
    await app.register(fastifyStatic, {
      root: distPath,
      wildcard: false,
    });
  } catch {
    // dist may not exist in dev mode
  }

  const db = createDb(dbPath);
  const siteService = new SiteService(db);
  const postService = new PostService(db);
  const interestService = new InterestService(db);

  const aiService = process.env.AI_API_KEY
    ? new AiService({
        apiKey: process.env.AI_API_KEY,
        baseUrl: process.env.AI_BASE_URL,
        model: process.env.AI_MODEL,
      })
    : null;

  const fetcherService = new FetcherService(
    postService, siteService, interestService,
    aiService,
    (name) => getAdapter(name),
  );

  app.decorate('services', {
    siteService, postService, aiService, interestService, fetcherService,
  });

  await app.register(postsRoutes, { prefix: '/api' });
  await app.register(sitesRoutes, { prefix: '/api' });
  await app.register(interestsRoutes, { prefix: '/api' });
  await app.register(fetchRoutes, { prefix: '/api' });

  app.setNotFoundHandler((req, reply) => {
    if (!req.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    reply.code(404).send({ error: 'Not found' });
  });

  return app;
}
