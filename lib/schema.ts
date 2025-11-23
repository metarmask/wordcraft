import { pgTable, serial, integer, text, jsonb, vector, PgVectorBuilder, smallint, boolean } from "drizzle-orm/pg-core";

export const DIMENSIONS = 3072

export const things = pgTable("things", {
  emoji: text().notNull(),
  thing: text().primaryKey(),
  n: serial(),
  // TODO: Retire this
  vector: vector({dimensions: DIMENSIONS}),
  verb: boolean(),
  noun: boolean(),
  adjective: boolean(),
});

export const embeddings = pgTable("embeddings", {
  text: text().primaryKey(),
  embedding: vector({dimensions: DIMENSIONS}).notNull()
});

export type Thing = typeof things.$inferSelect

export const results = pgTable("results", {
  recipe: text().primaryKey(),
  result: text().notNull(),
  n_uses: integer(),
});
