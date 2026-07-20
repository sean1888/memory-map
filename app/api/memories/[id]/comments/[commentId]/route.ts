import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id: memoryId, commentId } = await params;
  const { DB, IMAGES } = getBindings();
  const user = await requireUser(DB, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const comment = await DB.prepare(
    `SELECT actor_id, r2_key FROM memory_comments
     WHERE id = ? AND memory_id = ? AND deleted_at IS NULL`,
  )
    .bind(commentId, memoryId)
    .first<{ actor_id: string; r2_key: string | null }>();
  if (!comment) return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  if (comment.actor_id !== user.actorId) {
    return NextResponse.json({ error: "只能删除自己的评论" }, { status: 403 });
  }
  await DB.prepare(
    "UPDATE memory_comments SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(commentId)
    .run();
  if (comment.r2_key) await IMAGES.delete(comment.r2_key);
  return NextResponse.json({ success: true });
}
