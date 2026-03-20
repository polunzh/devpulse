import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscourseAdapter } from '../../src/adapters/discourse.adapter.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('DiscourseAdapter', () => {
  const adapter = new DiscourseAdapter();
  beforeEach(() => mockFetch.mockReset());

  it('should have correct name and displayName', () => {
    expect(adapter.name).toBe('discourse');
    expect(adapter.displayName).toBe('Discourse');
  });

  it('should have configSchema with url, mode, topPeriod, category, limit', () => {
    const keys = adapter.configSchema!.map(f => f.key);
    expect(keys).toEqual(['url', 'mode', 'topPeriod', 'category', 'limit']);
    expect(adapter.configSchema!.find(f => f.key === 'url')!.required).toBe(true);
    const mode = adapter.configSchema!.find(f => f.key === 'mode')!;
    expect(mode.type).toBe('select');
    expect(mode.options).toEqual([
      { label: 'Latest', value: 'latest' },
      { label: 'Top', value: 'top' },
    ]);
  });

  it('should normalize URL by stripping trailing slash', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics: [] }, users: [] }),
    });

    await adapter.fetchPosts({ url: 'https://linux.do/' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/latest.json?page=0',
      expect.any(Object),
    );
  });

  it('should fetch latest topics and map to RawPost', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: [{ id: 1, username: 'alice' }],
        topic_list: {
          topics: [{
            id: 42,
            title: 'Hello Discourse',
            slug: 'hello-discourse',
            excerpt: 'A sample topic',
            like_count: 10,
            reply_count: 5,
            created_at: '2026-03-20T10:00:00.000Z',
            posters: [{ user_id: 1 }],
          }],
        },
      }),
    });

    const posts = await adapter.fetchPosts({ url: 'https://linux.do' });
    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      externalId: '42',
      title: 'Hello Discourse',
      summary: 'A sample topic',
      url: 'https://linux.do/t/hello-discourse/42',
      author: 'alice',
      score: 15,
      publishedAt: new Date('2026-03-20T10:00:00.000Z'),
    });
  });

  it('should fetch top topics when mode is top', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics: [] }, users: [] }),
    });

    await adapter.fetchPosts({ url: 'https://linux.do', mode: 'top', topPeriod: 'monthly' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/top.json?period=monthly',
      expect.any(Object),
    );
  });

  it('should fetch category topics with slug resolution', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        category_list: {
          categories: [{ id: 7, slug: 'dev' }],
        },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics: [] }, users: [] }),
    });

    await adapter.fetchPosts({ url: 'https://linux.do', category: 'dev' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/categories.json',
      expect.any(Object),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://linux.do/c/dev/7.json',
      expect.any(Object),
    );
  });

  it('should throw when category slug is not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        category_list: { categories: [{ id: 1, slug: 'other' }] },
      }),
    });

    await expect(adapter.fetchPosts({ url: 'https://linux.do', category: 'nonexistent' }))
      .rejects.toThrow("Category 'nonexistent' not found");
  });

  it('should throw on invalid URL protocol', async () => {
    await expect(adapter.fetchPosts({ url: 'ftp://linux.do' }))
      .rejects.toThrow('URL must start with http:// or https://');
  });

  it('should throw on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(adapter.fetchPosts({ url: 'https://linux.do' }))
      .rejects.toThrow();
  });

  it('should respect limit config', async () => {
    const topics = Array.from({ length: 50 }, (_, i) => ({
      id: i, title: `T${i}`, slug: `t-${i}`, like_count: 0, reply_count: 0,
      created_at: '2026-01-01T00:00:00Z', posters: [],
    }));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ topic_list: { topics }, users: [] }),
    });

    const posts = await adapter.fetchPosts({ url: 'https://linux.do', limit: '10' });
    expect(posts).toHaveLength(10);
  });
});
