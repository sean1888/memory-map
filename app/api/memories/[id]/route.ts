import { NextResponse } from "next/server";
import { BOOKMARK_COOKIE, requireUser, serializeCookie } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { DB, IMAGES } = getBindings();
  const session = DB.withSession("first-primary");
  const user = await requireUser(session, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const memory = await session
    .prepare("SELECT actor_id FROM memories WHERE id = ? AND deleted_at IS NULL")
    .bind(id)
    .first<{ actor_id: string }>();
  if (!memory) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  if (memory.actor_id !== user.actorId) {
    return NextResponse.json({ error: "只能删除自己创建的记录" }, { status: 403 });
  }

  const { results: assets } = await session
    .prepare("SELECT r2_key FROM media_assets WHERE memory_id = ? AND r2_key IS NOT NULL")
    .bind(id)
    .all<{ r2_key: string }>();

  await session.batch([
    session
      .prepare(
        "UPDATE memories SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(id),
    session
      .prepare(
        `INSERT INTO audit_events
         (id, actor_id, entity_type, entity_id, action)
         VALUES (?, ?, 'memory', ?, 'delete')`,
      )
      .bind(crypto.randomUUID(), user.actorId, id),
  ]);

  await Promise.all(assets.map((asset) => IMAGES.delete(asset.r2_key)));
  const response = NextResponse.json({ success: true, bookmark: session.getBookmark() });
  const bookmark = session.getBookmark();
  if (bookmark)
    response.headers.append("Set-Cookie", serializeCookie(BOOKMARK_COOKIE, bookmark, 300));
  return response;
}
