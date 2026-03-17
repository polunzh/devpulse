import { describe, it, expect, vi, beforeEach } from 'vitest';
import { V2exAdapter } from '../../src/adapters/v2ex.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('V2exAdapter', () => {
  const adapter = new V2exAdapter();
  beforeEach(() => mockFetch.mockReset());

  it('should have correct name', () => {
    expect(adapter.name).toBe('v2ex');
  });

  it('should fetch hot topics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{
        id: 999, title: 'V2ex Topic', content: 'Some content...',
        url: 'https://www.v2ex.com/t/999', member: { username: 'user1' },
        replies: 42, created: 1700000000,
      }]),
    });

    const posts = await adapter.fetchPosts({});
    expect(posts).toHaveLength(1);
    expect(posts[0].externalId).toBe('999');
    expect(posts[0].score).toBe(42);
  });
});
