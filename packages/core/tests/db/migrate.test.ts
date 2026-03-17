import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import Database from 'better-sqlite3';
import { migrate } from '../../src/db/migrate.js';

describe('migrate', () => {
  const testDbPath = '/tmp/devpulse-test-migrate.db';

  afterEach(() => {
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
    if (existsSync(testDbPath + '-wal')) unlinkSync(testDbPath + '-wal');
    if (existsSync(testDbPath + '-shm')) unlinkSync(testDbPath + '-shm');
  });

  it('should create all tables', () => {
    migrate(testDbPath);
    const db = new Database(testDbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('sites');
    expect(tableNames).toContain('site_configs');
    expect(tableNames).toContain('posts');
    expect(tableNames).toContain('tags');
    expect(tableNames).toContain('post_tags');
    expect(tableNames).toContain('read_history');
    expect(tableNames).toContain('interests');
    db.close();
  });

  it('should be idempotent (run twice without error)', () => {
    migrate(testDbPath);
    migrate(testDbPath);
    const db = new Database(testDbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(tables.length).toBeGreaterThanOrEqual(7);
    db.close();
  });
});
