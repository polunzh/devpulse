import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { interests } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';

const BOOST_INCREMENT = 0.1;
const DECAY_RATE = 0.05;
const MIN_WEIGHT = 0.1;

export class InterestService {
  constructor(private db: AppDb) {}

  add(keyword: string, source: 'manual' | 'learned', weight = 1.0) {
    const existing = this.db.select().from(interests).where(eq(interests.keyword, keyword)).get();
    if (existing) return existing;

    const id = uuid();
    this.db.insert(interests).values({ id, keyword, weight, source }).run();
    return this.db.select().from(interests).where(eq(interests.id, id)).get()!;
  }

  listAll() {
    return this.db.select().from(interests).all();
  }

  remove(id: string) {
    this.db.delete(interests).where(eq(interests.id, id)).run();
  }

  updateWeight(id: string, weight: number) {
    this.db.update(interests).set({
      weight: Math.max(MIN_WEIGHT, weight),
      updatedAt: new Date().toISOString(),
    }).where(eq(interests.id, id)).run();
  }

  boostForTags(tagNames: string[]) {
    for (const tag of tagNames) {
      const existing = this.db.select().from(interests).where(eq(interests.keyword, tag)).get();
      if (existing) {
        this.updateWeight(existing.id, existing.weight + BOOST_INCREMENT);
      } else {
        this.add(tag, 'learned', BOOST_INCREMENT);
      }
    }
  }

  decayUnused(activeKeywords: Set<string>) {
    const all = this.listAll();
    for (const interest of all) {
      if (!activeKeywords.has(interest.keyword)) {
        this.updateWeight(interest.id, interest.weight - DECAY_RATE);
      }
    }
  }
}
