import { NextResponse } from "next/server";
import { z } from "zod";
import { getBindings } from "@/lib/cloudflare";

const usernameSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .regex(/^[\p{L}\p{N}_-]+$/u);

export async function GET(request: Request) {
  const parsed = usernameSchema.safeParse(new URL(request.url).searchParams.get("username"));
  if (!parsed.success)
    return NextResponse.json(
      { available: false, error: "用户名需为 2-20 位文字、数字、_ 或 -" },
      { status: 400 },
    );
  const row = await getBindings()
    .DB.prepare("SELECT 1 FROM actors WHERE username = ? COLLATE NOCASE")
    .bind(parsed.data)
    .first();
  return NextResponse.json({ available: !row }, { headers: { "Cache-Control": "no-store" } });
}
