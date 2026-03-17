import { describe, it, expect } from 'vitest';
import { getAdapter, getAllAdapters } from '../../src/adapters/index.js';

describe('Adapter Registry', () => {
  it('should return adapter by name', () => {
    const hn = getAdapter('hackernews');
    expect(hn).toBeDefined();
    expect(hn!.name).toBe('hackernews');
  });

  it('should return undefined for unknown adapter', () => {
    expect(getAdapter('nonexistent')).toBeUndefined();
  });

  it('should list all registered adapters', () => {
    const all = getAllAdapters();
    expect(all.length).toBeGreaterThanOrEqual(4);
    const names = all.map(a => a.name);
    expect(names).toContain('hackernews');
    expect(names).toContain('reddit');
    expect(names).toContain('v2ex');
    expect(names).toContain('medium');
  });
});
