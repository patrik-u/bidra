import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const entries = sqliteTable('registry_entries', {
  id: text('id').primaryKey(),
  draft: text('draft_json').notNull(),
  published: text('published_json'),
  status: text('status').notNull().default('draft'),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
  mutationId: text('mutation_id').notNull().default(''),
})
export const events = sqliteTable('registry_events', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull().references(() => entries.id),
  revision: integer('revision').notNull(),
  action: text('action').notNull(),
  actor: text('actor').notNull(),
  note: text('note').notNull(),
  snapshot: text('snapshot_json').notNull(),
  createdAt: text('created_at').notNull(),
}, table => [index('idx_events_entry_revision').on(table.entryId, table.revision)])
export const meta = sqliteTable('registry_meta', { key: text('key').primaryKey(), value: text('value').notNull() })
