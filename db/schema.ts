// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{code:text('code').primaryKey(),state:text('state').notNull(),hostHash:text('host_hash').notNull(),guestHash:text('guest_hash'),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()});
