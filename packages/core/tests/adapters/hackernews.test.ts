import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HackerNewsAdapter } from '../../src/adapters/hackernews.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('HackerNewsAdapter', () => {
  const adapter = new HackerNewsAdapter();

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should have correct name and displayName', () => {
    expect(adapter.name).toBe('hackernews');
    expect(adapter.displayName).toBe('Hacker News');
  });

  it('should fetch and parse top stories', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([101, 102]),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 101,
        title: 'Show HN: My Project',
        url: 'https://example.com/project',
        by: 'user1',
        score: 150,
        time: 1700000000,
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 102,
        title: 'Ask HN: Best Language?',
        url: '',
        by: 'user2',
        score: 80,
        time: 1700001000,
        text: 'What do you think about...',
      }),
    });

    const posts = await adapter.fetchPosts({ limit: '2' });

    expect(posts).toHaveLength(2);
    expect(posts[0].externalId).toBe('101');
    expect(posts[0].title).toBe('Show HN: My Project');
    expect(posts[0].url).toBe('https://example.com/project');
    expect(posts[0].score).toBe(150);
    expect(posts[1].url).toContain('news.ycombinator.com');
  });
});
