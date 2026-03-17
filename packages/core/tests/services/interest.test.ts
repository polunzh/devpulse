import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../test-helpers.js';
import { InterestService } from '../../src/services/interest.service.js';

describe('InterestService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;
  let service: InterestService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    service = new InterestService(db);
  });

  afterEach(() => sqlite.close());

  it('should add a manual interest', () => {
    service.add('Rust', 'manual');
    const all = service.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].keyword).toBe('Rust');
    expect(all[0].source).toBe('manual');
    expect(all[0].weight).toBe(1.0);
  });

  it('should not duplicate interests', () => {
    service.add('Rust', 'manual');
    service.add('Rust', 'manual');
    expect(service.listAll()).toHaveLength(1);
  });

  it('should boost weight when reading related tags', () => {
    service.add('AI', 'manual');
    service.boostForTags(['AI', 'LLM']);
    const all = service.listAll();
    const ai = all.find(i => i.keyword === 'AI');
    expect(ai!.weight).toBe(1.1);
    const llm = all.find(i => i.keyword === 'LLM');
    expect(llm).toBeDefined();
    expect(llm!.source).toBe('learned');
  });

  it('should decay unused interests', () => {
    service.add('OldTopic', 'learned');
    for (let i = 0; i < 7; i++) {
      service.decayUnused(new Set());
    }
    const interest = service.listAll().find(i => i.keyword === 'OldTopic');
    expect(interest!.weight).toBeCloseTo(0.65);
  });

  it('should not decay below 0.1', () => {
    service.add('OldTopic', 'learned');
    for (let i = 0; i < 100; i++) {
      service.decayUnused(new Set());
    }
    const interest = service.listAll().find(i => i.keyword === 'OldTopic');
    expect(interest!.weight).toBeGreaterThanOrEqual(0.1);
  });

  it('should remove an interest', () => {
    service.add('Rust', 'manual');
    const all = service.listAll();
    service.remove(all[0].id);
    expect(service.listAll()).toHaveLength(0);
  });
});
