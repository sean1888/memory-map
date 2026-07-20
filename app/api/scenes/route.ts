import { NextResponse } from "next/server";
import { BOOKMARK_COOKIE, getActorToken, readCookie } from "@/lib/auth";
import { getSceneData } from "@/lib/repository";

export async function GET(request: Request) {
  const data = await getSceneData(getActorToken(request), readCookie(request, BOOKMARK_COOKIE));
  if (!data) return NextResponse.json({ error: "暂无场景" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
