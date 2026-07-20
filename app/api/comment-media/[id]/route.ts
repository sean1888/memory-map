import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { DB, IMAGES } = getBindings();
  const comment = await DB.prepare(
    `SELECT c.memory_id, c.r2_key, c.content_type, m.visibility, m.actor_id
     FROM memory_comments c JOIN memories m ON m.id = c.memory_id
     WHERE c.id = ? AND c.deleted_at IS NULL AND m.deleted_at IS NULL`,
  )
    .bind(id)
    .first<{
      memory_id: string;
      r2_key: string | null;
      content_type: string | null;
      visibility: string;
      actor_id: string;
    }>();
  if (!comment?.r2_key) return new Response("Not found", { status: 404 });
  const user = await requireUser(DB, request);
  if (comment.visibility !== "public" && comment.actor_id !== user?.actorId) {
    return new Response("Not found", { status: 404 });
  }
  const object = await IMAGES.get(comment.r2_key, {
    onlyIf: { etagDoesNotMatch: request.headers.get("if-none-match") ?? undefined },
  });
  if (!object) return new Response("Not found", { status: 404 });
  if (!("body" in object)) return new Response(null, { status: 304 });
  return new Response(object.body, {
    headers: {
      "Content-Type": comment.content_type ?? "application/octet-stream",
      "Cache-Control":
        comment.visibility === "public"
          ? "public, max-age=3600, must-revalidate"
          : "private, no-store",
      ETag: object.httpEtag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
