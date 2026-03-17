import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../test-helpers.js';
import { FetcherService } from '../../src/services/fetcher.service.js';
import { SiteService } from '../../src/services/site.service.js';
import { PostService } from '../../src/services/post.service.js';
import { InterestService } from '../../src/services/interest.service.js';
import type { AiService } from '../../src/services/ai.service.js';
import type { Adapter } from '../../src/adapters/adapter.interface.js';

describe('FetcherService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;

  const mockAdapter: Adapter = {
    name: 'test',
    displayName: 'Test',
    async fetchPosts() {
      return [
        { externalId: '1', title: 'Post 1', url: 'http://a', score: 100 },
        { externalId: '2', title: 'Post 2', url: 'http://b', score: 50 },
      ];
    },
  };

  const mockAiService = {
    scorePosts: vi.fn().mockResolvedValue([
      { index: 0, score: 0.9, tags: ['AI'], reason: 'Good' },
      { index: 1, score: 0.5, tags: ['DevOps'], reason: 'OK' },
    ]),
  } as unknown as AiService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    vi.clearAllMocks();
  });

  afterEach(() => sqlite.close());

  it('should fetch from adapter, save posts, and score', async () => {
    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);
    const fetcher = new FetcherService(postService, siteService, interestService, mockAiService, () => mockAdapter);

    const site = siteService.create({ name: 'Test', adapter: 'test' });
    await fetcher.fetchSite(site.id);

    const posts = postService.list({});
    expect(posts).toHaveLength(2);
    expect(posts.some(p => p.aiScore === 0.9)).toBe(true);
  });

  it('should handle adapter errors gracefully', async () => {
    const failAdapter: Adapter = {
      name: 'fail',
      displayName: 'Fail',
      async fetchPosts() { throw new Error('Network error'); },
    };

    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);
    const fetcher = new FetcherService(postService, siteService, interestService, mockAiService, () => failAdapter);

    const site = siteService.create({ name: 'Fail', adapter: 'fail' });
    await fetcher.fetchSite(site.id);

    const posts = postService.list({});
    expect(posts).toHaveLength(0);
  });
});
