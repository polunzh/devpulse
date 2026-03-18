import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import * as schema from '../../src/db/schema.js';
import { createTestDb } from '../test-helpers.js';

describe('Database Schema', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: Database.Database;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
  });

  afterEach(() => {
    sqlite.close();
  });

  it('should insert and query a site', async () => {
    await db.insert(schema.sites).values({
      id: 'site-1',
      name: 'Hacker News',
      adapter: 'hackernews',
    }).run();

    const rows = await db.select().from(schema.sites).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Hacker News');
    expect(rows[0].enabled).toBe(1);
    expect(rows[0].fetchInterval).toBe(60);
  });

  it('should enforce unique site_id+external_id on posts', async () => {
    await db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
    await db.insert(schema.posts).values({
      id: 'p1', siteId: 's1', externalId: '123', title: 'T', url: 'http://x', fetchedAt: new Date().toISOString(),
    }).run();

    expect(() =>
      db.insert(schema.posts).values({
        id: 'p2', siteId: 's1', externalId: '123', title: 'T2', url: 'http://y', fetchedAt: new Date().toISOString(),
      }).run()
    ).toThrow();
  });

  it('should enforce interests source check constraint', async () => {
    expect(() =>
      db.insert(schema.interests).values({
        id: 'i1', keyword: 'Rust', weight: 1.0, source: 'invalid' as any,
      }).run()
    ).toThrow();
  });

  it('should insert and query read_history', async () => {
    await db.insert(schema.sites).values({ id: 's1', name: 'HN', adapter: 'hn' }).run();
    await db.insert(schema.posts).values({
      id: 'p1', siteId: 's1', externalId: '1', title: 'T', url: 'http://x', fetchedAt: new Date().toISOString(),
    }).run();
    await db.insert(schema.readHistory).values({ id: 'r1', postId: 'p1' }).run();

    const rows = await db.select().from(schema.readHistory).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].postId).toBe('p1');
  });
});
