import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { createDb } from '../../src/db/connection.js';

describe('createDb', () => {
  const testDbPath = '/tmp/devpulse-test-connection.db';

  afterEach(() => {
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
    if (existsSync(testDbPath + '-wal')) unlinkSync(testDbPath + '-wal');
    if (existsSync(testDbPath + '-shm')) unlinkSync(testDbPath + '-shm');
  });

  it('should create a database connection', () => {
    const db = createDb(testDbPath);
    expect(db).toBeDefined();
    expect(existsSync(testDbPath)).toBe(true);
  });
});
