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

  it('should create a site', async () => {
    const site = await service.create({ name: 'Hacker News', adapter: 'hackernews' });
    expect(site.name).toBe('Hacker News');
    expect(site.adapter).toBe('hackernews');
    expect(site.enabled).toBe(1);
  });

  it('should list all sites', async () => {
    await service.create({ name: 'HN', adapter: 'hackernews' });
    await service.create({ name: 'Reddit', adapter: 'reddit' });
    const sites = await service.listAll();
    expect(sites).toHaveLength(2);
  });

  it('should update a site', async () => {
    const site = await service.create({ name: 'HN', adapter: 'hn' });
    await service.update(site.id, { enabled: 0, fetchInterval: 30 });
    const updated = await service.getById(site.id);
    expect(updated?.enabled).toBe(0);
    expect(updated?.fetchInterval).toBe(30);
  });

  it('should manage site configs', async () => {
    const site = await service.create({ name: 'Reddit', adapter: 'reddit' });
    await service.setConfig(site.id, 'subreddit', 'programming');
    await service.setConfig(site.id, 'limit', '25');
    const configs = await service.getConfigs(site.id);
    expect(configs).toEqual({ subreddit: 'programming', limit: '25' });
  });

  it('should upsert site configs', async () => {
    const site = await service.create({ name: 'Reddit', adapter: 'reddit' });
    await service.setConfig(site.id, 'subreddit', 'programming');
    await service.setConfig(site.id, 'subreddit', 'typescript');
    const configs = await service.getConfigs(site.id);
    expect(configs.subreddit).toBe('typescript');
  });

  it('should delete a site', async () => {
    const site = await service.create({ name: 'HN', adapter: 'hn' });
    await service.delete(site.id);
    expect(await service.getById(site.id)).toBeUndefined();
  });

  it('should list only enabled sites', async () => {
    const s1 = await service.create({ name: 'HN', adapter: 'hn' });
    await service.create({ name: 'Reddit', adapter: 'reddit' });
    await service.update(s1.id, { enabled: 0 });
    const enabled = await service.listEnabled();
    expect(enabled).toHaveLength(1);
    expect(enabled[0].name).toBe('Reddit');
  });
});
