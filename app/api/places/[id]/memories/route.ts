import { NextResponse } from "next/server";
import { BOOKMARK_COOKIE, getActorToken, readCookie } from "@/lib/auth";
import { getPlaceMemoryPage } from "@/lib/repository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const page = await getPlaceMemoryPage(
    id,
    getActorToken(request),
    readCookie(request, BOOKMARK_COOKIE),
    url.searchParams.get("cursor"),
    Number(url.searchParams.get("limit") ?? 20),
  );
  return NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
}
