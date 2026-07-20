import { NextResponse } from "next/server";
import { BOOKMARK_COOKIE, getActorToken, readCookie } from "@/lib/auth";
import { getHomeData } from "@/lib/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const places = await getHomeData(
    url.searchParams.get("placeId") ?? undefined,
    getActorToken(request),
    readCookie(request, BOOKMARK_COOKIE),
  );
  return NextResponse.json({ places }, { headers: { "Cache-Control": "no-store" } });
}
