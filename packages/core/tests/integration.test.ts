import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestDb } from './test-helpers.js';
import { SiteService } from '../src/services/site.service.js';
import { PostService } from '../src/services/post.service.js';
import { InterestService } from '../src/services/interest.service.js';
import { FetcherService } from '../src/services/fetcher.service.js';
import type { AiService } from '../src/services/ai.service.js';
import type { Adapter } from '../src/adapters/adapter.interface.js';

describe('Integration: Full fetch-to-read flow', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;

  beforeEach(() => ({ db, sqlite } = createTestDb()));
  afterEach(() => sqlite.close());

  it('should add site, fetch posts, score, filter unread', async () => {
    const siteService = new SiteService(db);
    const postService = new PostService(db);
    const interestService = new InterestService(db);

    // Add interests
    interestService.add('Rust', 'manual');
    interestService.add('AI', 'manual');

    // Mock adapter
    const mockAdapter: Adapter = {
      name: 'test', displayName: 'Test',
      async fetchPosts() {
        return [
          { externalId: '1', title: 'Rust in Production', url: 'http://a', score: 200, author: 'dev1' },
          { externalId: '2', title: 'New AI Model', url: 'http://b', score: 150, author: 'dev2' },
          { externalId: '3', title: 'CSS Tricks', url: 'http://c', score: 50, author: 'dev3' },
        ];
      },
    };

    // Mock AI
    const mockAi = {
      scorePosts: vi.fn().mockResolvedValue([
        { index: 0, score: 0.95, tags: ['Rust', 'Systems'], reason: 'Directly about Rust' },
        { index: 1, score: 0.85, tags: ['AI', 'ML'], reason: 'AI related' },
        { index: 2, score: 0.2, tags: ['CSS', 'Frontend'], reason: 'Not in interests' },
      ]),
    } as unknown as AiService;

    const fetcher = new FetcherService(postService, siteService, interestService, mockAi, () => mockAdapter);

    // Create site and fetch
    const site = siteService.create({ name: 'Test Site', adapter: 'test' });
    await fetcher.fetchSite(site.id);

    // Verify posts exist with AI scores
    const allPosts = postService.list({ sortBy: 'score' });
    expect(allPosts).toHaveLength(3);
    expect(allPosts[0].title).toBe('Rust in Production');
    expect(allPosts[0].aiScore).toBe(0.95);

    // Mark first as read
    postService.markAsRead(allPosts[0].id);

    // Verify unread filter
    const unread = postService.list({ unreadOnly: true });
    expect(unread).toHaveLength(2);

    // Verify AI was called
    expect(mockAi.scorePosts).toHaveBeenCalledOnce();
  });
});
