import { eq, and, notInArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { posts, readHistory, tags, postTags } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';
import type { RawPost } from '../adapters/adapter.interface.js';

interface ListOptions {
  siteId?: string;
  unreadOnly?: boolean;
  sortBy?: 'score' | 'time';
  limit?: number;
  offset?: number;
}

export class PostService {
  constructor(private db: AppDb) {}

  async savePosts(siteId: string, rawPosts: (Omit<RawPost, 'publishedAt'> & { publishedAt?: Date })[]) {
    const now = new Date().toISOString();
    for (const raw of rawPosts) {
      const existing = await this.db.select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.siteId, siteId), eq(posts.externalId, raw.externalId)))
        .get();

      if (existing) {
        await this.db.update(posts).set({
          score: raw.score,
          updatedAt: now,
        }).where(eq(posts.id, existing.id)).run();
      } else {
        await this.db.insert(posts).values({
          id: uuid(),
          siteId,
          externalId: raw.externalId,
          title: raw.title,
          summary: raw.summary,
          url: raw.url,
          author: raw.author,
          score: raw.score,
          publishedAt: raw.publishedAt?.toISOString(),
          fetchedAt: now,
        }).run();
      }
    }
  }

  async list(options: ListOptions) {
    let query = this.db.select().from(posts);
    const conditions = [];

    if (options.siteId) {
      conditions.push(eq(posts.siteId, options.siteId));
    }

    if (options.unreadOnly) {
      const readPostIds = (await this.db.select({ postId: readHistory.postId }).from(readHistory).all()).map((r: any) => r.postId);
      if (readPostIds.length > 0) {
        conditions.push(notInArray(posts.id, readPostIds));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    let rows = where ? await query.where(where).all() : await query.all();

    if (options.sortBy === 'score' || !options.sortBy) {
      const siteMaxScores = new Map<string, number>();
      for (const row of rows) {
        const current = siteMaxScores.get(row.siteId) || 0;
        if ((row.score || 0) > current) {
          siteMaxScores.set(row.siteId, row.score || 0);
        }
      }

      rows.sort((a: any, b: any) => {
        const aMaxScore = siteMaxScores.get(a.siteId) || 1;
        const bMaxScore = siteMaxScores.get(b.siteId) || 1;
        const aNorm = (a.score || 0) / (aMaxScore || 1);
        const bNorm = (b.score || 0) / (bMaxScore || 1);
        const aFinal = aNorm * 0.4 + (a.aiScore ?? aNorm) * 0.6;
        const bFinal = bNorm * 0.4 + (b.aiScore ?? bNorm) * 0.6;
        return bFinal - aFinal;
      });
    } else {
      rows.sort((a: any, b: any) => {
        const aTime = a.publishedAt || a.fetchedAt;
        const bTime = b.publishedAt || b.fetchedAt;
        return bTime.localeCompare(aTime);
      });
    }

    const offset = options.offset || 0;
    const limit = options.limit || 50;
    return rows.slice(offset, offset + limit);
  }

  async markAsRead(postId: string) {
    const existing = await this.db.select().from(readHistory).where(eq(readHistory.postId, postId)).get();
    if (!existing) {
      await this.db.insert(readHistory).values({ id: uuid(), postId }).run();
    }
  }

  async isRead(postId: string): Promise<boolean> {
    return !!(await this.db.select().from(readHistory).where(eq(readHistory.postId, postId)).get());
  }

  async getPostTags(postId: string): Promise<string[]> {
    const rows = await this.db.select({ name: tags.name })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, postId))
      .all();
    return rows.map((r: any) => r.name);
  }

  async updateAiScore(postId: string, aiScore: number, aiReason: string, tagNames: string[]) {
    await this.db.update(posts).set({
      aiScore,
      aiReason,
      updatedAt: new Date().toISOString(),
    }).where(eq(posts.id, postId)).run();

    for (const name of tagNames) {
      let tag = await this.db.select().from(tags).where(eq(tags.name, name)).get();
      if (!tag) {
        const tagId = uuid();
        await this.db.insert(tags).values({ id: tagId, name }).run();
        tag = { id: tagId, name, createdAt: '', updatedAt: '' };
      }
      const existing = await this.db.select().from(postTags)
        .where(and(eq(postTags.postId, postId), eq(postTags.tagId, tag.id))).get();
      if (!existing) {
        await this.db.insert(postTags).values({ postId, tagId: tag.id }).run();
      }
    }
  }
}
