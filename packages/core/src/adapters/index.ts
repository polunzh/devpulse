import type { Adapter } from './adapter.interface.js';
import { HackerNewsAdapter } from './hackernews.adapter.js';
import { RedditAdapter } from './reddit.adapter.js';
import { V2exAdapter } from './v2ex.adapter.js';
import { MediumAdapter } from './medium.adapter.js';

const adapters = new Map<string, Adapter>();

function register(adapter: Adapter) {
  adapters.set(adapter.name, adapter);
}

register(new HackerNewsAdapter());
register(new RedditAdapter());
register(new V2exAdapter());
register(new MediumAdapter());

export function getAdapter(name: string): Adapter | undefined {
  return adapters.get(name);
}

export function getAllAdapters(): Adapter[] {
  return Array.from(adapters.values());
}
