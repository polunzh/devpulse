import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedditAdapter } from '../../src/adapters/reddit.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('RedditAdapter', () => {
  const adapter = new RedditAdapter();
  beforeEach(() => mockFetch.mockReset());

  it('should have correct name', () => {
    expect(adapter.name).toBe('reddit');
  });

  it('should fetch subreddit hot posts', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: {
          children: [{
            data: {
              id: 'abc123', title: 'Rust is fast', selftext: 'Some text...',
              url: 'https://reddit.com/r/programming/abc', permalink: '/r/programming/comments/abc123/',
              author: 'rustfan', score: 500, created_utc: 1700000000,
            },
          }],
        },
      }),
    });

    const posts = await adapter.fetchPosts({ subreddit: 'programming', limit: '10' });
    expect(posts).toHaveLength(1);
    expect(posts[0].externalId).toBe('abc123');
    expect(posts[0].score).toBe(500);
  });
});
