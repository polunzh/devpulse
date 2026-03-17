import type { Adapter } from './adapter.interface.js';
import { HackerNewsAdapter } from './hackernews.adapter.js';

const adapters = new Map<string, Adapter>();

function register(adapter: Adapter) {
  adapters.set(adapter.name, adapter);
}

register(new HackerNewsAdapter());

export function getAdapter(name: string): Adapter | undefined {
  return adapters.get(name);
}

export function getAllAdapters(): Adapter[] {
  return Array.from(adapters.values());
}
