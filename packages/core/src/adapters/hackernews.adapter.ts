import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

const HN_API = 'https://hacker-news.firebaseio.com/v0';

interface HNItem {
  id: number;
  title: string;
  url?: string;
  by?: string;
  score: number;
  time: number;
  text?: string;
}

export class HackerNewsAdapter implements Adapter {
  name = 'hackernews';
  displayName = 'Hacker News';

  configSchema = [
    { key: 'limit', label: 'Number of posts', type: 'number' as const, defaultValue: '30' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const limit = parseInt(config.limit || '30', 10);

    const res = await fetch(`${HN_API}/topstories.json`);
    const ids: number[] = await res.json();
    const topIds = ids.slice(0, limit);

    const items = await Promise.all(
      topIds.map(async (id) => {
        const r = await fetch(`${HN_API}/item/${id}.json`);
        return r.json() as Promise<HNItem>;
      })
    );

    return items.map((item) => ({
      externalId: String(item.id),
      title: item.title,
      summary: item.text?.slice(0, 200),
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      author: item.by,
      score: item.score,
      publishedAt: new Date(item.time * 1000),
    }));
  }
}
