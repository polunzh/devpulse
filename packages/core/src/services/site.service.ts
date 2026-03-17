import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { sites, siteConfigs } from '../db/schema.js';
import type { AppDb } from '../db/connection.js';

interface CreateSiteInput {
  name: string;
  adapter: string;
  enabled?: number;
  fetchInterval?: number;
}

interface UpdateSiteInput {
  name?: string;
  enabled?: number;
  fetchInterval?: number;
  lastFetchedAt?: string;
}

export class SiteService {
  constructor(private db: AppDb) {}

  create(input: CreateSiteInput) {
    const id = uuid();
    this.db.insert(sites).values({
      id,
      name: input.name,
      adapter: input.adapter,
      enabled: input.enabled ?? 1,
      fetchInterval: input.fetchInterval ?? 60,
    }).run();
    return this.getById(id)!;
  }

  getById(id: string) {
    return this.db.select().from(sites).where(eq(sites.id, id)).get();
  }

  listAll() {
    return this.db.select().from(sites).all();
  }

  listEnabled() {
    return this.db.select().from(sites).where(eq(sites.enabled, 1)).all();
  }

  update(id: string, input: UpdateSiteInput) {
    this.db.update(sites).set({
      ...input,
      updatedAt: new Date().toISOString(),
    }).where(eq(sites.id, id)).run();
  }

  delete(id: string) {
    this.db.delete(siteConfigs).where(eq(siteConfigs.siteId, id)).run();
    this.db.delete(sites).where(eq(sites.id, id)).run();
  }

  setConfig(siteId: string, key: string, value: string) {
    const existing = this.db.select().from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId))
      .all()
      .find(c => c.key === key);

    if (existing) {
      this.db.update(siteConfigs).set({
        value,
        updatedAt: new Date().toISOString(),
      }).where(eq(siteConfigs.id, existing.id)).run();
    } else {
      this.db.insert(siteConfigs).values({
        id: uuid(),
        siteId,
        key,
        value,
      }).run();
    }
  }

  getConfigs(siteId: string): Record<string, string> {
    const rows = this.db.select().from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId)).all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
}
