import { NextResponse } from "next/server";
import { consumeAuthLimit, requireUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { readValidatedImage } from "@/lib/images";
import { canAccessMemory } from "@/lib/memory-access";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: memoryId } = await params;
  const { DB, IMAGES } = getBindings();
  const user = await requireUser(DB, request);
  if (!user) return NextResponse.json({ error: "请先登录后再评论" }, { status: 401 });
  if (!(await consumeAuthLimit(DB, request, "comment", user.actorId, 30, 10 * 60))) {
    return NextResponse.json({ error: "评论过于频繁，请稍后再试" }, { status: 429 });
  }
  if (!(await canAccessMemory(DB, memoryId, user.actorId))) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  const formData = await request.formData();
  const textValue = formData.get("text");
  const text = typeof textValue === "string" ? textValue.trim() : "";
  if (text.length > 500)
    return NextResponse.json({ error: "评论最多 500 个字符" }, { status: 400 });
  const imageValue = formData.get("image");
  const hasImage = imageValue instanceof File && imageValue.size > 0;
  const image = hasImage ? await readValidatedImage(imageValue, 2 * 1024 * 1024) : null;
  if (hasImage && !image) {
    return NextResponse.json(
      { error: "请选择不超过 2MB 的 JPG、PNG 或 WebP 图片" },
      { status: 400 },
    );
  }
  if (!text && !image) return NextResponse.json({ error: "请输入文字或选择图片" }, { status: 400 });

  const commentId = crypto.randomUUID();
  const key = image ? `comments/${memoryId}/${commentId}.${image.extension}` : null;
  if (image && key) {
    await IMAGES.put(key, image.bytes, {
      httpMetadata: { contentType: image.file.type, cacheControl: "public, max-age=3600" },
      customMetadata: { memoryId, commentId },
    });
  }
  try {
    await DB.prepare(
      `INSERT INTO memory_comments (id, memory_id, actor_id, body, r2_key, content_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(commentId, memoryId, user.actorId, text || null, key, image?.file.type ?? null)
      .run();
  } catch {
    if (key) await IMAGES.delete(key);
    return NextResponse.json({ error: "评论发布失败，请稍后重试" }, { status: 500 });
  }
  return NextResponse.json({
    comment: {
      id: commentId,
      authorId: user.actorId,
      author: user.displayName,
      authorAvatarUrl: user.avatarUrl,
      text: text || null,
      imageUrl: key ? `/api/comment-media/${commentId}` : null,
      createdAt: new Date().toISOString(),
      canDelete: true,
    },
  });
}
