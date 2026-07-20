import { NextResponse } from "next/server";
import { BOOKMARK_COOKIE, getActorToken, readCookie } from "@/lib/auth";
import { getSceneData } from "@/lib/repository";

export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get("place");
  if (!placeId) return NextResponse.json({ error: "缺少地点" }, { status: 400 });
  const data = await getSceneData(
    placeId,
    getActorToken(request),
    readCookie(request, BOOKMARK_COOKIE),
  );
  if (!data) return NextResponse.json({ error: "暂无场景" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
