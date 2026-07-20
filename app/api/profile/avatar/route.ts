import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

const types = new Set(["image/jpeg", "image/png", "image/webp"]);

function validSignature(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return (
    type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function POST(request: Request) {
  const { DB, IMAGES } = getBindings();
  const user = await requireUser(DB, request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const file = (await request.formData()).get("avatar");
  if (!(file instanceof File) || !types.has(file.type) || file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "请选择不超过 2MB 的 JPG、PNG 或 WebP 图片" },
      { status: 400 },
    );
  }
  const content = new Uint8Array(await file.arrayBuffer());
  if (!validSignature(content, file.type))
    return NextResponse.json({ error: "图片文件无效" }, { status: 400 });
  const existing = await DB.prepare("SELECT avatar_r2_key FROM actors WHERE id = ?")
    .bind(user.actorId)
    .first<{ avatar_r2_key: string | null }>();
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `avatars/${user.actorId}/${crypto.randomUUID()}.${extension}`;
  await IMAGES.put(key, content, {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=3600" },
  });
  await DB.prepare(
    "UPDATE actors SET avatar_r2_key = ?, avatar_content_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  )
    .bind(key, file.type, user.actorId)
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
