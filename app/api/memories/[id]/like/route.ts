import { NextResponse } from "next/server";
import { consumeAuthLimit, requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { canAccessMemory } from "@/lib/memory-access";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getBindings().DB.withSession("first-primary");
  const user = await requireUser(db, request);
  if (!user) return NextResponse.json({ error: "请先登录后再点赞" }, { status: 401 });
  if (!(await consumeAuthLimit(db, request, "like", user.actorId, 120, 10 * 60))) {
    return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
  }
  if (!(await canAccessMemory(db, id, user.actorId))) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }
  const existing = await db
    .prepare("SELECT 1 FROM memory_likes WHERE memory_id = ? AND actor_id = ?")
    .bind(id, user.actorId)
    .first();
  if (existing) {
    await db
      .prepare("DELETE FROM memory_likes WHERE memory_id = ? AND actor_id = ?")
      .bind(id, user.actorId)
      .run();
  } else {
    await db
      .prepare("INSERT INTO memory_likes (memory_id, actor_id) VALUES (?, ?)")
      .bind(id, user.actorId)
      .run();
  }
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM memory_likes WHERE memory_id = ?")
    .bind(id)
    .first<{ count: number }>();
  return NextResponse.json({ liked: !existing, likeCount: Number(row?.count ?? 0) });
}
