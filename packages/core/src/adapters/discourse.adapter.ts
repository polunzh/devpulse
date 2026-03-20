import type { Adapter, RawPost, SiteConfig, ConfigField } from './adapter.interface.js';

interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  posters: { user_id: number }[];
}

interface DiscourseUser {
  id: number;
  username: string;
}

export class DiscourseAdapter implements Adapter {
  name = 'discourse';
  displayName = 'Discourse';

  configSchema: ConfigField[] = [
    { key: 'url', label: 'Forum URL', type: 'text', required: true },
    {
      key: 'mode', label: 'Fetch mode', type: 'select', defaultValue: 'latest',
      options: [
        { label: 'Latest', value: 'latest' },
        { label: 'Top', value: 'top' },
      ],
    },
    {
      key: 'topPeriod', label: 'Top period', type: 'select', defaultValue: 'weekly',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'All Time', value: 'all' },
      ],
    },
    { key: 'category', label: 'Category slug (optional)', type: 'text' },
    { key: 'limit', label: 'Number of posts', type: 'number', defaultValue: '30' },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const baseUrl = (config.url || '').replace(/\/+$/, '');
    if (!baseUrl) throw new Error('Discourse URL is required');
    if (!/^https?:\/\//.test(baseUrl)) throw new Error('URL must start with http:// or https://');

    const mode = config.mode || 'latest';
    const topPeriod = config.topPeriod || 'weekly';
    const category = config.category || '';
    const limit = parseInt(config.limit || '30', 10);

    let apiUrl: string;

    if (category) {
      const categoryId = await this.resolveCategoryId(baseUrl, category);
      if (mode === 'top') {
        apiUrl = `${baseUrl}/c/${category}/${categoryId}/l/top.json?period=${topPeriod}`;
      } else {
        apiUrl = `${baseUrl}/c/${category}/${categoryId}.json`;
      }
    } else if (mode === 'top') {
      apiUrl = `${baseUrl}/top.json?period=${topPeriod}`;
    } else {
      apiUrl = `${baseUrl}/latest.json?page=0`;
    }

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Discourse API error: ${res.status}`);

    const json = await res.json() as {
      topic_list: { topics: DiscourseTopic[] };
      users: DiscourseUser[];
    };

    const users = new Map((json.users || []).map(u => [u.id, u.username]));
    const topics = (json.topic_list?.topics || []).slice(0, limit);

    return topics.map((t) => ({
      externalId: String(t.id),
      title: t.title,
      summary: t.excerpt || undefined,
      url: `${baseUrl}/t/${t.slug}/${t.id}`,
      author: t.posters?.[0] ? users.get(t.posters[0].user_id) : undefined,
      score: (t.like_count || 0) + (t.reply_count || 0),
      publishedAt: new Date(t.created_at),
    }));
  }

  private async resolveCategoryId(baseUrl: string, slug: string): Promise<number> {
    const res = await fetch(`${baseUrl}/categories.json`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);

    const json = await res.json() as {
      category_list: { categories: { id: number; slug: string }[] };
    };
    const cat = json.category_list.categories.find(c => c.slug === slug);
    if (!cat) throw new Error(`Category '${slug}' not found`);
    return cat.id;
  }
}
