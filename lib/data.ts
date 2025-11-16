import 'server-only'

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql, TableConfig } from "drizzle-orm";
import OpenAI from "openai";
import * as schema from './schema';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { Thing } from './schema';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const db = drizzle(pool, {schema});
const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function resultPrompt(recipe: string): Promise<string> {
const response = await client.responses.create({
    model: "gpt-4.1-mini",
//     instructions: `You receive a prompt and answer with what new thing, person, idea or concept they are getting at. You NEVER ask questions. Examples:
//  planet-like fire -> star
//  land of the free -> United States of America
//  leaves for hot water -> tea
//  watch the -> video
//  water on a farm -> irrigation
//  found in ocean -> marine life
//  Ireland crop -> potato
//  reverse windmill -> fan
//  sequence discipline -> operational checklist
//  low sugar -> hypoglycemia
//  steam through turbine -> electricity`,
  instructions: 
`Given only the clue, what is the mystery thing, person, idea or concept? Examples:
 planet-like fire -> star
 land of the free -> United States of America
 contradiction book -> Catch-22
 watch the -> video
 it legend -> Alan Turing
 water on a farm -> irrigation
 strict teacher -> Snape
 not democracy -> dictatorship
 Ireland crop -> potato
 the language -> English
 reverse windmill -> fan
 legendary soul -> Psyche
 sequence discipline -> checklist
 low sugar -> hypoglycemia
 fractured word -> emphasis
 biscuit lesson -> patience`,
    input: [
      {
        role: "user",
        content: " "+recipe
      }
    ],
    text: { format: { type: "text" } },
    reasoning: {},
    max_output_tokens: 16
  })
  return response.output_text
}

async function emojiPrompt(thing: string): Promise<string> {
const response = await client.responses.create({
    model: "gpt-4.1-mini",
//     instructions: `You receive a prompt and answer with what new thing, person, idea or concept they are getting at. You NEVER ask questions. Examples:
//  planet-like fire -> star
//  land of the free -> United States of America
//  leaves for hot water -> tea
//  watch the -> video
//  water on a farm -> irrigation
//  found in ocean -> marine life
//  Ireland crop -> potato
//  reverse windmill -> fan
//  sequence discipline -> operational checklist
//  low sugar -> hypoglycemia
//  steam through turbine -> electricity`,
  instructions: 
`You convert concepts into a single emoji. Examples:
 milk -> 🥛
 law -> 📜
 word -> 🔠`,
    input: [
      {
        role: "user",
        content: " "+thing
      }
    ],
    text: { format: { type: "text" } },
    reasoning: {},
    max_output_tokens: 16
  })
  return response.output_text
}

async function getEmbedding(thing: string): Promise<number[]> {
  return (await client.embeddings.create({input: thing, model: "text-embedding-3-large"})).data[0].embedding
}

export async function getThing(thing: string): Promise<Thing | undefined> {
  const things = schema.things
  const dbResult = await db.select().from(things).where(eq(things.thing, thing))
  if (dbResult.length) {
    return dbResult[0]
  }
}
async function getOrCreateThing(thing: string): Promise<Thing> {
  const existingThing = await getThing(thing)
  if (existingThing) {
    return existingThing
  }
  const [emoji, vector] = await Promise.all([emojiPrompt(thing), getEmbedding(thing)])
  const things = schema.things
  await db.insert(things).values({emoji, thing, vector})
  return (await db.select().from(things).where(eq(things.thing, thing)))[0]!
}


export async function craft(recipe: string): Promise<Thing> {
  recipe = recipe.trim().split(/\s/g).join(" ");
  // await db.execute(sql`INSERT INTO results (recipe, result) VALUES (${recipe}, ${result}) ON CONFLICT (id) DO UPDATE SET count = counters.count + 1;`);
  // const result = await db.execute(sql`UPDATE results SET n_uses=n_uses+1 WHERE recipe=${recipe};`);
  // if (result.rowCount??0 > 0) {
  // const dbResult = await db.query.results.findFirst({where: (items, {eq}) => eq("recipe", recipe)})
  // }
  // const item = await db.query.results.findFirst({where: (items, { eq }) => eq(items.recipe, recipe)});
  const rs = schema.results
  const dbResult = await db.select().from(rs).where(eq(rs.recipe, recipe))
  if (dbResult.length) {
    return getOrCreateThing(dbResult[0].result)
  }
  const result = await resultPrompt(recipe)
  const [_, thing] = await Promise.all([
    db.execute(sql`INSERT INTO results (recipe, result, n_uses) VALUES (${recipe}, ${result}, 0)`),
    getOrCreateThing(result)
  ])
  return thing
}



