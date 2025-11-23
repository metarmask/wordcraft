import { craft } from "@/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body || typeof body.recipe !== "string") {
    return NextResponse.json({error: "Missing recipe string"}, {status: 400});
  }

  const result = await craft(body.recipe);
  return NextResponse.json(result);
}
