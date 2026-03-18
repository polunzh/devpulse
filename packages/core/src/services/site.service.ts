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

  async create(input: CreateSiteInput) {
    const id = uuid();
    await this.db.insert(sites).values({
      id,
      name: input.name,
      adapter: input.adapter,
      enabled: input.enabled ?? 1,
      fetchInterval: input.fetchInterval ?? 60,
    }).run();
    return (await this.getById(id))!;
  }

  async getById(id: string) {
    return await this.db.select().from(sites).where(eq(sites.id, id)).get();
  }

  async listAll() {
    return await this.db.select().from(sites).all();
  }

  async listEnabled() {
    return await this.db.select().from(sites).where(eq(sites.enabled, 1)).all();
  }

  async update(id: string, input: UpdateSiteInput) {
    await this.db.update(sites).set({
      ...input,
      updatedAt: new Date().toISOString(),
    }).where(eq(sites.id, id)).run();
  }

  async delete(id: string) {
    await this.db.delete(siteConfigs).where(eq(siteConfigs.siteId, id)).run();
    await this.db.delete(sites).where(eq(sites.id, id)).run();
  }

  async setConfig(siteId: string, key: string, value: string) {
    const rows = await this.db.select().from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId))
      .all();
    const existing = rows.find(c => c.key === key);

    if (existing) {
      await this.db.update(siteConfigs).set({
        value,
        updatedAt: new Date().toISOString(),
      }).where(eq(siteConfigs.id, existing.id)).run();
    } else {
      await this.db.insert(siteConfigs).values({
        id: uuid(),
        siteId,
        key,
        value,
      }).run();
    }
  }

  async getConfigs(siteId: string): Promise<Record<string, string>> {
    const rows = await this.db.select().from(siteConfigs)
      .where(eq(siteConfigs.siteId, siteId)).all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
}
