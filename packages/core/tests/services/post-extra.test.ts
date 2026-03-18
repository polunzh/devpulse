import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as schema from '../../src/db/schema.js';
import { createTestDb } from '../test-helpers.js';
import { PostService } from '../../src/services/post.service.js';

describe('PostService (extra coverage)', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;
  let service: PostService;

  beforeEach(async () => {
    ({ db, sqlite } = createTestDb());
    service = new PostService(db);
    await db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
  });

  afterEach(() => sqlite.close());

  it('should sort by time', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'Old', url: 'http://a', score: 10, publishedAt: new Date('2025-01-01') },
      { externalId: '2', title: 'New', url: 'http://b', score: 5, publishedAt: new Date('2026-03-01') },
    ]);
    const sorted = await service.list({ sortBy: 'time' });
    expect(sorted[0].title).toBe('New');
    expect(sorted[1].title).toBe('Old');
  });

  it('should respect limit and offset', async () => {
    for (let i = 0; i < 10; i++) {
      await service.savePosts('s1', [
        { externalId: String(i), title: `Post ${i}`, url: `http://${i}`, score: i },
      ]);
    }
    const page = await service.list({ limit: 3, offset: 2 });
    expect(page).toHaveLength(3);
  });

  it('should check isRead', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T', url: 'http://a', score: 10 },
    ]);
    const post = (await service.list({}))[0];
    expect(await service.isRead(post.id)).toBe(false);
    await service.markAsRead(post.id);
    expect(await service.isRead(post.id)).toBe(true);
  });

  it('should not duplicate read history', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T', url: 'http://a', score: 10 },
    ]);
    const post = (await service.list({}))[0];
    await service.markAsRead(post.id);
    await service.markAsRead(post.id); // should not throw
    expect(await service.isRead(post.id)).toBe(true);
  });

  it('should get post tags after AI scoring', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T', url: 'http://a', score: 10 },
    ]);
    const post = (await service.list({}))[0];
    await service.updateAiScore(post.id, 0.9, 'Great', ['Rust', 'Systems']);
    const tags = await service.getPostTags(post.id);
    expect(tags).toContain('Rust');
    expect(tags).toContain('Systems');
  });

  it('should not duplicate tags on repeated scoring', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T', url: 'http://a', score: 10 },
    ]);
    const post = (await service.list({}))[0];
    await service.updateAiScore(post.id, 0.9, 'Great', ['Rust']);
    await service.updateAiScore(post.id, 0.95, 'Even better', ['Rust', 'AI']);
    const tags = await service.getPostTags(post.id);
    expect(tags).toHaveLength(2);
    expect(tags).toContain('Rust');
    expect(tags).toContain('AI');
  });

  it('should handle unread filter when no reads exist', async () => {
    await service.savePosts('s1', [
      { externalId: '1', title: 'T', url: 'http://a', score: 10 },
    ]);
    const unread = await service.list({ unreadOnly: true });
    expect(unread).toHaveLength(1);
  });
});
