import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { canAccessMemory } from "@/lib/memory-access";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { DB } = getBindings();
  const user = await requireUser(DB, request);
  if (!(await canAccessMemory(DB, id, user?.actorId ?? null))) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }
  const [{ results: comments }, likeRow] = await Promise.all([
    DB.prepare(
      `SELECT c.id, c.actor_id, c.body, c.r2_key, c.created_at,
              a.display_name, a.avatar_r2_key
       FROM memory_comments c JOIN actors a ON a.id = c.actor_id
       WHERE c.memory_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at, c.id`,
    )
      .bind(id)
      .all<{
        id: string;
        actor_id: string;
        body: string | null;
        r2_key: string | null;
        created_at: string;
        display_name: string;
        avatar_r2_key: string | null;
      }>(),
    DB.prepare(
      `SELECT COUNT(*) AS count,
              EXISTS(SELECT 1 FROM memory_likes WHERE memory_id = ? AND actor_id = ?) AS liked
       FROM memory_likes WHERE memory_id = ?`,
    )
      .bind(id, user?.actorId ?? "", id)
      .first<{ count: number; liked: number }>(),
  ]);
  return NextResponse.json(
    {
      comments: comments.map((comment) => ({
        id: comment.id,
        authorId: comment.actor_id,
        author: comment.display_name,
        authorAvatarUrl: comment.avatar_r2_key ? `/api/avatars/${comment.actor_id}` : null,
        text: comment.body,
        imageUrl: comment.r2_key ? `/api/comment-media/${comment.id}` : null,
        createdAt: comment.created_at,
        canDelete: comment.actor_id === user?.actorId,
      })),
      likeCount: Number(likeRow?.count ?? 0),
      liked: Boolean(likeRow?.liked),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
