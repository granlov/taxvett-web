import { pgTable, serial, text, boolean, timestamp, integer, unique } from 'drizzle-orm/pg-core'

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  keyHash: text('key_hash').notNull().unique(),
  plan: text('plan').notNull().default('free'),
  isActive: boolean('is_active').notNull().default(true),
  stripeCustomerId: text('stripe_customer_id').unique(),
  email: text('email'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
})

export const usageLog = pgTable('usage_log', {
  id: serial('id').primaryKey(),
  apiKeyId: integer('api_key_id')
    .notNull()
    .references(() => apiKeys.id),
  endpoint: text('endpoint').notNull(),
  country: text('country'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  apiKeyId: integer('api_key_id')
    .notNull()
    .references(() => apiKeys.id),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const numberStatus = pgTable('number_status', {
  id: serial('id').primaryKey(),
  apiKeyId: integer('api_key_id')
    .notNull()
    .references(() => apiKeys.id),
  number: text('number').notNull(),
  isValid: boolean('is_valid').notNull(),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
}, (table) => [
  unique('number_status_api_key_id_number_unique').on(table.apiKeyId, table.number),
])
