import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../../src/services/ai.service.js';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    mockCreate.mockReset();
    service = new AiService('test-api-key');
  });

  it('should score posts and return results', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify([
          { index: 0, score: 0.85, tags: ['AI', 'LLM'], reason: 'Highly relevant to AI interest' },
          { index: 1, score: 0.3, tags: ['DevOps'], reason: 'Low relevance' },
        ]),
      }],
    });

    const results = await service.scorePosts(
      [
        { title: 'New LLM Breakthrough', summary: 'A new model...', source: 'HN' },
        { title: 'Docker Tips', summary: 'Container tricks...', source: 'Reddit' },
      ],
      [{ keyword: 'AI', weight: 0.9 }],
    );

    expect(results).toHaveLength(2);
    expect(results[0].score).toBe(0.85);
    expect(results[0].tags).toContain('AI');
    expect(results[1].score).toBe(0.3);
  });

  it('should return empty results on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Rate limited'));

    const results = await service.scorePosts(
      [{ title: 'Test', summary: '', source: 'HN' }],
      [],
    );

    expect(results).toHaveLength(0);
  });
});
