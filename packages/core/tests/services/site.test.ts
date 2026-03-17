import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTestDb } from '../test-helpers.js';
import { SiteService } from '../../src/services/site.service.js';

describe('SiteService', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: Database.Database;
  let service: SiteService;

  beforeEach(() => {
    ({ db, sqlite } = createTestDb());
    service = new SiteService(db);
  });

  afterEach(() => sqlite.close());

  it('should create a site', () => {
    const site = service.create({ name: 'Hacker News', adapter: 'hackernews' });
    expect(site.name).toBe('Hacker News');
    expect(site.adapter).toBe('hackernews');
    expect(site.enabled).toBe(1);
  });

  it('should list all sites', () => {
    service.create({ name: 'HN', adapter: 'hackernews' });
    service.create({ name: 'Reddit', adapter: 'reddit' });
    const sites = service.listAll();
    expect(sites).toHaveLength(2);
  });

  it('should update a site', () => {
    const site = service.create({ name: 'HN', adapter: 'hn' });
    service.update(site.id, { enabled: 0, fetchInterval: 30 });
    const updated = service.getById(site.id);
    expect(updated?.enabled).toBe(0);
    expect(updated?.fetchInterval).toBe(30);
  });

  it('should manage site configs', () => {
    const site = service.create({ name: 'Reddit', adapter: 'reddit' });
    service.setConfig(site.id, 'subreddit', 'programming');
    service.setConfig(site.id, 'limit', '25');
    const configs = service.getConfigs(site.id);
    expect(configs).toEqual({ subreddit: 'programming', limit: '25' });
  });

  it('should upsert site configs', () => {
    const site = service.create({ name: 'Reddit', adapter: 'reddit' });
    service.setConfig(site.id, 'subreddit', 'programming');
    service.setConfig(site.id, 'subreddit', 'typescript');
    const configs = service.getConfigs(site.id);
    expect(configs.subreddit).toBe('typescript');
  });

  it('should delete a site', () => {
    const site = service.create({ name: 'HN', adapter: 'hn' });
    service.delete(site.id);
    expect(service.getById(site.id)).toBeUndefined();
  });

  it('should list only enabled sites', () => {
    const s1 = service.create({ name: 'HN', adapter: 'hn' });
    service.create({ name: 'Reddit', adapter: 'reddit' });
    service.update(s1.id, { enabled: 0 });
    const enabled = service.listEnabled();
    expect(enabled).toHaveLength(1);
    expect(enabled[0].name).toBe('Reddit');
  });
});
