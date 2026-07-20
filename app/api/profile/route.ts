import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

const updateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[^\p{C}]+$/u),
});

export async function GET(request: Request) {
  const db = getBindings().DB;
  const user = await requireUser(db, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { results } = await db
    .prepare(
      `SELECT m.id, m.note, m.visibility, m.created_at, m.captured_at, p.name AS place_name,
      (SELECT url FROM media_assets WHERE memory_id = m.id ORDER BY sort_order LIMIT 1) AS cover
     FROM memories m JOIN places p ON p.id = m.place_id
     WHERE m.actor_id = ? AND m.deleted_at IS NULL
     ORDER BY COALESCE(m.captured_at, m.created_at) DESC`,
    )
    .bind(user.actorId)
    .all<{
      id: string;
      note: string;
      visibility: string;
      created_at: string;
      captured_at: string | null;
      place_name: string;
      cover: string | null;
    }>();
  return NextResponse.json(
    { user, memories: results },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const db = getBindings().DB.withSession("first-primary");
  const user = await requireUser(db, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "昵称需为 2-30 个字符" }, { status: 400 });
  await db
    .prepare("UPDATE actors SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(parsed.data.displayName, user.actorId)
    .run();
  return NextResponse.json({ success: true, displayName: parsed.data.displayName });
}
