import RSSParser from 'rss-parser';
import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

const parser = new RSSParser();

export class MediumAdapter implements Adapter {
  name = 'medium';
  displayName = 'Medium';

  configSchema = [
    { key: 'feedUrl', label: 'RSS Feed URL', type: 'text' as const, required: true, defaultValue: 'https://medium.com/feed/tag/programming' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const feedUrl = config.feedUrl || 'https://medium.com/feed/tag/programming';
    const feed = await parser.parseURL(feedUrl);

    return feed.items.map((item, index) => ({
      externalId: item.guid || item.link || String(index),
      title: item.title || 'Untitled',
      summary: item.contentSnippet?.slice(0, 200),
      url: item.link || '',
      author: item.creator,
      score: 0,
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
    }));
  }
}
