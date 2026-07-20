import { getBindings } from "@/lib/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ actorId: string }> }) {
  const { actorId } = await params;
  const { DB, IMAGES } = getBindings();
  const actor = await DB.prepare(
    "SELECT avatar_r2_key, avatar_content_type FROM actors WHERE id = ? AND is_anonymous = 0",
  )
    .bind(actorId)
    .first<{ avatar_r2_key: string | null; avatar_content_type: string | null }>();
  if (!actor?.avatar_r2_key) return new Response("Not found", { status: 404 });
  const object = await IMAGES.get(actor.avatar_r2_key, {
    onlyIf: { etagDoesNotMatch: request.headers.get("if-none-match") ?? undefined },
  });
  if (!object) return new Response("Not found", { status: 404 });
  if (!("body" in object)) return new Response(null, { status: 304 });
  return new Response(object.body, {
    headers: {
      "Content-Type": actor.avatar_content_type ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      ETag: object.httpEtag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
