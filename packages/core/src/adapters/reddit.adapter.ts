import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  author: string;
  score: number;
  created_utc: number;
}

export class RedditAdapter implements Adapter {
  name = 'reddit';
  displayName = 'Reddit';

  configSchema = [
    { key: 'subreddit', label: 'Subreddit name', type: 'text' as const, required: true, defaultValue: 'programming' },
    { key: 'limit', label: 'Number of posts', type: 'number' as const, defaultValue: '25' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const subreddit = config.subreddit || 'programming';
    const limit = config.limit || '25';

    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      { headers: { 'User-Agent': 'DevPulse/0.1' } }
    );
    const json = await res.json();

    return json.data.children.map((child: { data: RedditPost }) => {
      const d = child.data;
      return {
        externalId: d.id,
        title: d.title,
        summary: d.selftext?.slice(0, 200) || undefined,
        url: d.url.startsWith('/') ? `https://reddit.com${d.url}` : d.url,
        author: d.author,
        score: d.score,
        publishedAt: new Date(d.created_utc * 1000),
      };
    });
  }
}
