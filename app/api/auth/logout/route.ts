import { NextResponse } from "next/server";
import { clearCookie, getSessionToken, hashToken, SESSION_COOKIE } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export async function POST(request: Request) {
  const token = getSessionToken(request);
  if (token)
    await getBindings()
      .DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await hashToken(token))
      .run();
  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", clearCookie(SESSION_COOKIE));
  return response;
}
