import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export async function GET(request: Request) {
  const user = await requireUser(getBindings().DB, request);
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
