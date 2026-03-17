import Anthropic from '@anthropic-ai/sdk';

interface PostInput {
  title: string;
  summary?: string;
  source: string;
}

interface InterestInput {
  keyword: string;
  weight: number;
}

interface ScoreResult {
  index: number;
  score: number;
  tags: string[];
  reason: string;
}

export class AiService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async scorePosts(posts: PostInput[], interests: InterestInput[]): Promise<ScoreResult[]> {
    if (posts.length === 0) return [];

    const interestList = interests
      .map(i => `${i.keyword} (weight: ${i.weight})`)
      .join(', ') || 'No specific interests configured';

    const postList = posts
      .map((p, i) => `${i}. [${p.source}] ${p.title}${p.summary ? ` - ${p.summary}` : ''}`)
      .join('\n');

    const prompt = `You are a developer content recommendation assistant.
User interests: ${interestList}

Score these posts (0-1) based on relevance to the user's interests, extract tags, and give a brief reason:
${postList}

Return ONLY valid JSON array:
[{"index": 0, "score": 0.85, "tags": ["AI"], "reason": "..."}]`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]) as ScoreResult[];
    } catch (error) {
      console.error('AI scoring failed:', error);
      return [];
    }
  }
}
