import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as schema from '../../src/db/schema.js';
import { createTestDb } from '../test-helpers.js';
import { PostService } from '../../src/services/post.service.js';

describe('PostService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;
  let service: PostService;

  beforeEach(async () => {
    ({ db, sqlite } = createTestDb());
    service = new PostService(db);
    await db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
  });

  afterEach(() => sqlite.close());

  it('should save posts and deduplicate by site+externalId', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T1', url: 'http://a', score: 10 },
      { externalId: '2', title: 'T2', url: 'http://b', score: 20 },
    ]);
    await service.savePosts('s1', [
      { externalId: '1', title: 'T1-updated', url: 'http://a', score: 15 },
      { externalId: '3', title: 'T3', url: 'http://c', score: 5 },
    ]);
    const posts = await service.list({});
    expect(posts).toHaveLength(3);
  });

  it('should filter posts by siteId', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T1', url: 'http://a', score: 10 },
    ]);
    const filtered = await service.list({ siteId: 's1' });
    expect(filtered).toHaveLength(1);
    const empty = await service.list({ siteId: 'nonexistent' });
    expect(empty).toHaveLength(0);
  });

  it('should mark post as read and filter unread', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T1', url: 'http://a', score: 10 },
      { externalId: '2', title: 'T2', url: 'http://b', score: 20 },
    ]);
    const allPosts = await service.list({});
    await service.markAsRead(allPosts[0].id);

    const unread = await service.list({ unreadOnly: true });
    expect(unread).toHaveLength(1);
  });

  it('should sort by finalScore (ai_score weighted)', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'Low', url: 'http://a', score: 10 },
      { externalId: '2', title: 'High', url: 'http://b', score: 100 },
    ]);
    const allPosts = await service.list({});
    await service.updateAiScore(allPosts.find(p => p.title === 'Low')!.id, 0.9, 'Very relevant', []);
    await service.updateAiScore(allPosts.find(p => p.title === 'High')!.id, 0.1, 'Not relevant', []);

    const sorted = await service.list({ sortBy: 'score' });
    expect(sorted[0].title).toBe('Low');
  });
});
