import type { Adapter, RawPost, SiteConfig } from './adapter.interface.js';

interface V2exTopic {
  id: number;
  title: string;
  content: string;
  url: string;
  member: { username: string };
  replies: number;
  created: number;
}

export class V2exAdapter implements Adapter {
  name = 'v2ex';
  displayName = 'V2EX';

  configSchema = [
    { key: 'token', label: 'API Token (optional)', type: 'text' as const },
  ];

  async fetchPosts(config: SiteConfig): Promise<RawPost[]> {
    const headers: Record<string, string> = {};
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    const res = await fetch('https://www.v2ex.com/api/topics/hot.json', { headers });
    const topics: V2exTopic[] = await res.json();

    return topics.map((t) => ({
      externalId: String(t.id),
      title: t.title,
      summary: t.content?.slice(0, 200) || undefined,
      url: t.url || `https://www.v2ex.com/t/${t.id}`,
      author: t.member?.username,
      score: t.replies,
      publishedAt: new Date(t.created * 1000),
    }));
  }
}
