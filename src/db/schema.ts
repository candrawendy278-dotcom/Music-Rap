import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const saves = pgTable('saves', {
  id: serial('id').primaryKey(),
  userId: text('user_uid').references(() => users.uid).notNull().unique(),
  gameState: jsonb('game_state').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
  save: one(saves),
}));

export const savesRelations = relations(saves, ({ one }) => ({
  user: one(users, {
    fields: [saves.userId],
    references: [users.uid],
  }),
}));
