import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const credentials = sqliteTable('credentials', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  publicKey: blob('public_key', { mode: 'buffer' }).notNull(),
  counter: integer('counter').notNull().default(0),
  deviceType: text('device_type').notNull(),
  backedUp: integer('backed_up', { mode: 'boolean' }).notNull().default(false),
  transports: text('transports', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
