import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@devpulse/core/db/schema';
import { SiteService, PostService, AiService, InterestService, FetcherService, getAdapter } from '@devpulse/core';
import { postsRoutes } from './routes/posts.js';
import { sitesRoutes } from './routes/sites.js';
import { interestsRoutes } from './routes/interests.js';
import { fetchRoutes } from './routes/fetch.js';

export interface Env {
  DB: D1Database;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;   // e.g. https://api.moonshot.cn/v1
  AI_MODEL?: string;      // e.g. moonshot-v1-8k
}

export interface AppServices {
  siteService: SiteService;
  postService: PostService;
  aiService: AiService | null;
  interestService: InterestService;
  fetcherService: FetcherService;
}

type Variables = {
  services: AppServices;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', cors());

// Initialize services per request
app.use('/api/*', async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  const siteService = new SiteService(db);
  const postService = new PostService(db);
  const interestService = new InterestService(db);
  const aiService = c.env.AI_API_KEY
    ? new AiService({ apiKey: c.env.AI_API_KEY, baseUrl: c.env.AI_BASE_URL, model: c.env.AI_MODEL })
    : null;
  const fetcherService = new FetcherService(
    postService, siteService, interestService,
    aiService,
    (name) => getAdapter(name),
  );
  c.set('services', { siteService, postService, aiService, interestService, fetcherService });
  await next();
});

// Register routes
app.route('/api', postsRoutes);
app.route('/api', sitesRoutes);
app.route('/api', interestsRoutes);
app.route('/api', fetchRoutes);

// Cron trigger for scheduled fetch
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const db = drizzle(env.DB, { schema });
    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);
    const aiService = env.AI_API_KEY
      ? new AiService({ apiKey: env.AI_API_KEY, baseUrl: env.AI_BASE_URL, model: env.AI_MODEL })
      : null;
    const fetcherService = new FetcherService(
      postService, siteService, interestService,
      aiService,
      (name) => getAdapter(name),
    );
    ctx.waitUntil(fetcherService.fetchAll());
  },
};
