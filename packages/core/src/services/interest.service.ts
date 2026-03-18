import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { interests } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';

const BOOST_INCREMENT = 0.1;
const DECAY_RATE = 0.05;
const MIN_WEIGHT = 0.1;

export class InterestService {
  constructor(private db: AppDb) {}

  async add(keyword: string, source: 'manual' | 'learned', weight = 1.0) {
    const existing = await this.db.select().from(interests).where(eq(interests.keyword, keyword)).get();
    if (existing) return existing;

    const id = uuid();
    await this.db.insert(interests).values({ id, keyword, weight, source }).run();
    return (await this.db.select().from(interests).where(eq(interests.id, id)).get())!;
  }

  async listAll() {
    return await this.db.select().from(interests).all();
  }

  async remove(id: string) {
    await this.db.delete(interests).where(eq(interests.id, id)).run();
  }

  async updateWeight(id: string, weight: number) {
    await this.db.update(interests).set({
      weight: Math.max(MIN_WEIGHT, weight),
      updatedAt: new Date().toISOString(),
    }).where(eq(interests.id, id)).run();
  }

  async boostForTags(tagNames: string[]) {
    for (const tag of tagNames) {
      const existing = await this.db.select().from(interests).where(eq(interests.keyword, tag)).get();
      if (existing) {
        await this.updateWeight(existing.id, existing.weight + BOOST_INCREMENT);
      } else {
        await this.add(tag, 'learned', BOOST_INCREMENT);
      }
    }
  }

  async decayUnused(activeKeywords: Set<string>) {
    const all = await this.listAll();
    for (const interest of all) {
      if (!activeKeywords.has(interest.keyword)) {
        await this.updateWeight(interest.id, interest.weight - DECAY_RATE);
      }
    }
  }
}
