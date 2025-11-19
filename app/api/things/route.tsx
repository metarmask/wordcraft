import { getAllThings, getOrCreateThing } from "@/lib/data";
import { NextResponse } from "next/server";
import OpenAI from "openai";


export async function GET(req: Request) {
  return NextResponse.json(await getAllThings());
}

export async function POST(req: Request) {
  const reqBody = await req.json()
  return NextResponse.json(await getOrCreateThing(reqBody.thing))
}