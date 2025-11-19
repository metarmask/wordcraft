import { pgTable, serial, integer, text, jsonb, vector, PgVectorBuilder, smallint, boolean } from "drizzle-orm/pg-core";


export const things = pgTable("things", {
  emoji: text().notNull(),
  thing: text().primaryKey(),
  n: serial(),
  vector: vector({dimensions: 3072}),
  verb: boolean(),
  noun: boolean(),
  adjective: boolean(),
});

export type Thing = typeof things.$inferSelect

export const results = pgTable("results", {
  recipe: text().primaryKey(),
  result: text().notNull(),
  n_uses: integer(),
});
