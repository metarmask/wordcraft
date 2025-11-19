import { getEmbedding } from "@/lib/data"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const reqBody = await req.json()
  return NextResponse.json(await getEmbedding(reqBody.text))
}