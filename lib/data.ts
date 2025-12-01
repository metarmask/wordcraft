import 'server-only'

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql, TableConfig } from "drizzle-orm";
import OpenAI from "openai";
import * as schema from './schema';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { Thing } from './schema';
import emojiRegex from 'emoji-regex-xs'

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
`Given only the clue, what is the mystery thing, person, idea or concept? Immediate reply only. Examples:
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
  return response.output_text.replace(/^.+? -> /, "")
}

async function emojiPrompt(thing: string): Promise<string> {
  const response = await client.responses.create({
      model: "gpt-5-nano",
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
    text: { format: { type: "text" }, verbosity: "low"},
    reasoning: {
      "effort": "minimal"
    },
    max_output_tokens: 32
  })
  let regex = emojiRegex()
  regex = new RegExp(`(${regex.source})+`, regex.flags)
  return [...response.output_text.matchAll(regex)].map(([a]) => a)[0]??response.output_text
}

interface WordClasses {
  verb: boolean,
  noun: boolean,
  adjective: boolean,
}

async function classPrompt(thing: string): Promise<WordClasses> {
  const response = await client.responses.create({
      model: "gpt-5-nano",
    input: [
      {
        "role": "developer",
        "content": [
          {
            "type": "input_text",
            "text": "Output all the word classes the provided phrase can function as."
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": " " + thing
          }
        ]
      },
    ],
    text: {
      "format": {
        "type": "json_schema",
        "name": "matching_categories",
        "strict": true,
        "schema": {
          "type": "object",
          "properties": {
            "verb": {
              "type": "boolean"
            },
            "noun": {
              "type": "boolean"
            },
            "adjective": {
              "type": "boolean"
            }
          },
          "required": [
            "verb",
            "noun",
            "adjective"
          ],
          "additionalProperties": false
        }
      },
      "verbosity": "medium"
    },
    reasoning: {
      "effort": "minimal"
    },
    max_output_tokens: 45
  })
  return JSON.parse(response.output_text) as WordClasses
}

export async function getEmbedding(text: string): Promise<number[]> {
  const found = await db.select().from(schema.embeddings).where(eq(schema.embeddings.text, text))
  if (found.length > 0) {
    return found[0].embedding
  }
  const embedding = (await client.embeddings.create({input: " "+text, model: "text-embedding-3-large"})).data[0].embedding
  // Do this in parallel, maybe
  await db.insert(schema.embeddings).values({text, embedding}).onConflictDoNothing()
  return embedding
}

export async function getThing(thing: string): Promise<Thing | undefined> {
  const things = schema.things
  const dbResult = await db.select().from(things).where(eq(things.thing, thing))
  if (dbResult.length) {
    return dbResult[0]
  }
}
export async function getOrCreateThing(thing: string): Promise<Thing> {
  const existingThing = await getThing(thing)
  if (existingThing) {
    return existingThing
  }
  const [emoji, vector, classes] = await Promise.all([emojiPrompt(thing), getEmbedding(thing), classPrompt(thing)])
  // const emoji = await emojiPrompt(thing)
  // const vector = await getEmbedding(thing)
  // const classes = await classPrompt(thing)
  const things = schema.things
  await db.insert(things).values({emoji, thing, vector, ...classes}).onConflictDoNothing()
  return (await db.select().from(things).where(eq(things.thing, thing)))[0]!
}

export async function getAllThings(): Promise<Thing[]> {
  const allowed = ["grammar", "article"]
  for (const a of allowed) {
    await getOrCreateThing(a)
  }
  console.log(db.select().from(schema.things).where(sql`thing in ${allowed}`).toSQL())
  return await db.select().from(schema.things).where(sql`thing in ${allowed}`)
}


export async function craft(recipe: string): Promise<Thing> {
  recipe = recipe.trim().split(/\s/g).join(" ");
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



