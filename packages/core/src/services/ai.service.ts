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

interface AiConfig {
  apiKey: string;
  baseUrl?: string;  // Default: https://api.openai.com/v1
  model?: string;    // Default: gpt-4o-mini
}

// Preset providers for convenience
export const AI_PROVIDERS = {
  openai:  { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  kimi:    { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  qwen:    { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
  minimax: { baseUrl: 'https://api.minimax.chat/v1', model: 'MiniMax-Text-01' },
  deepseek:{ baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  claude:  { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
} as const;

export class AiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: AiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.model = config.model || 'gpt-4o-mini';
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

Score these posts (0-1) based on relevance to the user's interests, extract tags, and give a brief reason (in Chinese).
${postList}

Return ONLY valid JSON array:
[{"index": 0, "score": 0.85, "tags": ["AI"], "reason": "简短的中文推荐理由"}]`;

    try {
      const isAnthropic = this.baseUrl.includes('anthropic.com');

      const response = isAnthropic
        ? await this.callAnthropic(prompt)
        : await this.callOpenAICompatible(prompt);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]) as ScoreResult[];
    } catch (error) {
      console.error('AI scoring failed:', error);
      return [];
    }
  }

  private async callOpenAICompatible(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI API error: ${res.status} ${await res.text()}`);
    }

    const json = await res.json() as any;
    return json.choices?.[0]?.message?.content || '';
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    }

    const json = await res.json() as any;
    return json.content?.[0]?.text || '';
  }
}
