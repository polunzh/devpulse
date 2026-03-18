import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../../src/services/ai.service.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new AiService({ apiKey: 'test-key', baseUrl: 'https://api.example.com/v1', model: 'test-model' });
  });

  it('should score posts and return results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify([
              { index: 0, score: 0.85, tags: ['AI', 'LLM'], reason: 'Highly relevant' },
              { index: 1, score: 0.3, tags: ['DevOps'], reason: 'Low relevance' },
            ]),
          },
        }],
      }),
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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    });

    const results = await service.scorePosts(
      [{ title: 'Test', summary: '', source: 'HN' }],
      [],
    );

    expect(results).toHaveLength(0);
  });

  it('should call Anthropic API when baseUrl contains anthropic.com', async () => {
    const anthropicService = new AiService({
      apiKey: 'test-key',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-sonnet-4-20250514',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        content: [{ type: 'text', text: '[]' }],
      }),
    });

    await anthropicService.scorePosts(
      [{ title: 'Test', source: 'HN' }],
      [],
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      }),
    );
  });
});
