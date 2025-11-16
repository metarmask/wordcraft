import { pgTable, serial, integer, text, jsonb, vector, PgVectorBuilder, smallint } from "drizzle-orm/pg-core";


export const things = pgTable("things", {
  emoji: text().notNull(),
  thing: text().primaryKey(),
  n: serial(),
  vector: vector({dimensions: 3072})
});

export type Thing = typeof things.$inferSelect

export const results = pgTable("results", {
  recipe: text("recipe").primaryKey(),
  result: text("result").notNull(),
  n_uses: integer("n_uses")
});
