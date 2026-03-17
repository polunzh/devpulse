import { sqliteTable, text, integer, real, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const timestamps = {
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
};

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  adapter: text('adapter').notNull(),
  enabled: integer('enabled').notNull().default(1),
  fetchInterval: integer('fetch_interval').notNull().default(60),
  lastFetchedAt: text('last_fetched_at'),
  ...timestamps,
});

export const siteConfigs = sqliteTable('site_configs', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('site_configs_site_id_key_unique').on(table.siteId, table.key),
]);

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  externalId: text('external_id').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  url: text('url').notNull(),
  author: text('author'),
  score: integer('score').default(0),
  aiScore: real('ai_score'),
  aiReason: text('ai_reason'),
  publishedAt: text('published_at'),
  fetchedAt: text('fetched_at').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('posts_site_external_unique').on(table.siteId, table.externalId),
]);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  ...timestamps,
});

export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
]);

export const readHistory = sqliteTable('read_history', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().unique().references(() => posts.id),
  ...timestamps,
});

export const interests = sqliteTable('interests', {
  id: text('id').primaryKey(),
  keyword: text('keyword').notNull().unique(),
  weight: real('weight').notNull().default(1.0),
  source: text('source').notNull(),
  ...timestamps,
});
