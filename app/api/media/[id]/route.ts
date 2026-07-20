import { getBindings } from "@/lib/cloudflare";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { DB, IMAGES } = getBindings();
  const asset = await DB.prepare("SELECT r2_key FROM media_assets WHERE id = ?")
    .bind(id)
    .first<{ r2_key: string | null }>();
  if (!asset?.r2_key) return new Response("Not found", { status: 404 });

  const object = await IMAGES.get(asset.r2_key, {
    onlyIf: { etagDoesNotMatch: request.headers.get("if-none-match") ?? undefined },
  });
  if (!object) return new Response(null, { status: 304 });
  if (!("body" in object)) return new Response(null, { status: 304 });

  const headers = new Headers();
  const metadata = object.httpMetadata;
  if (metadata?.contentType) headers.set("Content-Type", metadata.contentType);
  if (metadata?.contentLanguage) headers.set("Content-Language", metadata.contentLanguage);
  if (metadata?.contentDisposition) headers.set("Content-Disposition", metadata.contentDisposition);
  if (metadata?.contentEncoding) headers.set("Content-Encoding", metadata.contentEncoding);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
