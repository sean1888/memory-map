import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { DB, IMAGES } = getBindings();
  const asset = await DB.prepare(
    `SELECT media_assets.r2_key, memories.visibility, memories.actor_id
     FROM media_assets
     JOIN memories ON memories.id = media_assets.memory_id
     WHERE media_assets.id = ? AND memories.deleted_at IS NULL`,
  )
    .bind(id)
    .first<{ r2_key: string | null; visibility: "self" | "public"; actor_id: string }>();
  if (!asset?.r2_key) return new Response("Not found", { status: 404 });

  if (asset.visibility === "self") {
    const user = await requireUser(DB, request);
    if (user?.actorId !== asset.actor_id) return new Response("Not found", { status: 404 });
  }

  const object = await IMAGES.get(asset.r2_key, {
    onlyIf: { etagDoesNotMatch: request.headers.get("if-none-match") ?? undefined },
  });
  if (!object) return new Response("Not found", { status: 404 });
  if (!("body" in object)) return new Response(null, { status: 304 });

  const headers = new Headers();
  const metadata = object.httpMetadata;
  if (metadata?.contentType) headers.set("Content-Type", metadata.contentType);
  if (metadata?.contentLanguage) headers.set("Content-Language", metadata.contentLanguage);
  if (metadata?.contentDisposition) headers.set("Content-Disposition", metadata.contentDisposition);
  if (metadata?.contentEncoding) headers.set("Content-Encoding", metadata.contentEncoding);
  headers.set("ETag", object.httpEtag);
  headers.set(
    "Cache-Control",
    asset.visibility === "self" ? "private, no-store" : "public, max-age=3600, must-revalidate",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
