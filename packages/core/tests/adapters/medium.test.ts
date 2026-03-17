import { describe, it, expect, vi } from 'vitest';
import { MediumAdapter } from '../../src/adapters/medium.adapter.js';

vi.mock('rss-parser', () => ({
  default: class {
    async parseURL() {
      return {
        items: [{
          guid: 'medium-post-1', title: 'AI in 2026',
          contentSnippet: 'The future of AI...', link: 'https://medium.com/p/123',
          creator: 'writer1', pubDate: '2026-03-15T00:00:00Z',
        }],
      };
    }
  },
}));

describe('MediumAdapter', () => {
  const adapter = new MediumAdapter();

  it('should have correct name', () => {
    expect(adapter.name).toBe('medium');
  });

  it('should parse RSS feed', async () => {
    const posts = await adapter.fetchPosts({ feedUrl: 'https://medium.com/feed/tag/programming' });
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('AI in 2026');
    expect(posts[0].score).toBe(0);
  });
});
