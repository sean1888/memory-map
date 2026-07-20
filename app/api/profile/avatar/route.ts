import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { readValidatedImage } from "@/lib/images";

export async function POST(request: Request) {
  const { DB, IMAGES } = getBindings();
  const user = await requireUser(DB, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const image = await readValidatedImage((await request.formData()).get("avatar"), 2 * 1024 * 1024);
  if (!image) {
    return NextResponse.json(
      { error: "请选择不超过 2MB 的 JPG、PNG 或 WebP 图片" },
      { status: 400 },
    );
  }
  const existing = await DB.prepare("SELECT avatar_r2_key FROM actors WHERE id = ?")
    .bind(user.actorId)
    .first<{ avatar_r2_key: string | null }>();
  const key = `avatars/${user.actorId}/${crypto.randomUUID()}.${image.extension}`;
  await IMAGES.put(key, image.bytes, {
    httpMetadata: { contentType: image.file.type, cacheControl: "public, max-age=3600" },
  });
  await DB.prepare(
    "UPDATE actors SET avatar_r2_key = ?, avatar_content_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(key, image.file.type, user.actorId)
    .run();
  if (existing?.avatar_r2_key) await IMAGES.delete(existing.avatar_r2_key);
  return NextResponse.json({
    success: true,
    avatarUrl: `/api/avatars/${user.actorId}?v=${Date.now()}`,
  });
}

export async function DELETE(request: Request) {
  const { DB, IMAGES } = getBindings();
  const user = await requireUser(DB, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const actor = await DB.prepare("SELECT avatar_r2_key FROM actors WHERE id = ?")
    .bind(user.actorId)
    .first<{ avatar_r2_key: string | null }>();
  await DB.prepare(
    "UPDATE actors SET avatar_r2_key = NULL, avatar_content_type = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(user.actorId)
    .run();
  if (actor?.avatar_r2_key) await IMAGES.delete(actor.avatar_r2_key);
  return NextResponse.json({ success: true });
}
