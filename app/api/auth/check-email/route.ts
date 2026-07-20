import { NextResponse } from "next/server";
import { z } from "zod";
import { getBindings } from "@/lib/cloudflare";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export async function GET(request: Request) {
  const parsed = emailSchema.safeParse(new URL(request.url).searchParams.get("email"));
  if (!parsed.success)
    return NextResponse.json({ available: false, error: "请输入有效邮箱" }, { status: 400 });
  const row = await getBindings()
    .DB.prepare("SELECT 1 FROM accounts WHERE email = ?")
    .bind(parsed.data)
    .first();
  return NextResponse.json({ available: !row }, { headers: { "Cache-Control": "no-store" } });
}
