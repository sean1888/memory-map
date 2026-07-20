import { NextResponse } from "next/server";
import { z } from "zod";
import { BOOKMARK_COOKIE, ensureActor, serializeCookie } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

const MAX_FILES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const inputSchema = z.object({
  clientRequestId: z.string().uuid(),
  author: z.string().trim().min(1).max(30),
  note: z.string().trim().min(1).max(2000),
  placeId: z.string().min(1),
  placeName: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  sceneId: z.string().optional(),
  sceneTitle: z.string().trim().max(120).optional(),
  directionDegrees: z.coerce.number().min(0).max(360).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  capturedAt: z.string().datetime().optional(),
  weather: z.string().trim().max(40).optional(),
  temperature: z.coerce.number().min(-100).max(100).optional(),
  visibility: z.enum(["self", "public"]).default("public"),
  source: z.enum(["exif", "manual", "location"]).default("manual"),
  gpsAccuracy: z.coerce.number().min(0).max(100000).optional(),
});

function optionalString(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value : undefined;
}

function extensionFor(type: string): string {
  return (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    }[type] ?? "bin"
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = inputSchema.safeParse({
    clientRequestId: formData.get("clientRequestId"),
    author: formData.get("author"),
    note: formData.get("note"),
    placeId: formData.get("placeId"),
    placeName: optionalString(formData, "placeName"),
    city: optionalString(formData, "city"),
    address: optionalString(formData, "address"),
    sceneId: optionalString(formData, "sceneId"),
    sceneTitle: optionalString(formData, "sceneTitle"),
    directionDegrees: optionalString(formData, "directionDegrees"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    capturedAt: optionalString(formData, "capturedAt"),
    weather: optionalString(formData, "weather"),
    temperature: optionalString(formData, "temperature"),
    visibility: optionalString(formData, "visibility"),
    source: optionalString(formData, "source"),
    gpsAccuracy: optionalString(formData, "gpsAccuracy"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "提交内容不完整", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (
    files.length > MAX_FILES ||
    totalSize > MAX_TOTAL_SIZE ||
    files.some((file) => file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.has(file.type))
  ) {
    return NextResponse.json(
      { error: "最多上传 6 张图片，单张不超过 5MB，总计不超过 20MB" },
      { status: 413 },
    );
  }

  const { DB, IMAGES } = getBindings();
  const session = DB.withSession("first-primary");
  const input = parsed.data;
  const existing = await session
    .prepare("SELECT id FROM memories WHERE client_request_id = ?")
    .bind(input.clientRequestId)
    .first<{ id: string }>();
  if (existing) {
    return NextResponse.json({ success: true, id: existing.id, duplicate: true });
  }

  const actor = await ensureActor(session, request, input.author);
  const memoryId = crypto.randomUUID();
  let placeId = input.placeId;
  let sceneId = input.sceneId ?? null;
  const statements: D1PreparedStatement[] = [];

  if (placeId === "new") {
    if (!input.placeName || !input.city) {
      return NextResponse.json({ error: "新地点需要填写地点名称和城市" }, { status: 400 });
    }
    placeId = crypto.randomUUID();
    statements.push(
      session
        .prepare(
          `INSERT INTO places
           (id, name, city, address, latitude, longitude, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          placeId,
          input.placeName,
          input.city,
          input.address ?? null,
          input.latitude,
          input.longitude,
          actor.actorId,
        ),
    );
  } else {
    const place = await session
      .prepare("SELECT id FROM places WHERE id = ?")
      .bind(placeId)
      .first<{ id: string }>();
    if (!place) return NextResponse.json({ error: "地点不存在" }, { status: 404 });
  }

  if (sceneId === "new") {
    if (!input.sceneTitle) {
      return NextResponse.json({ error: "新视角需要填写名称" }, { status: 400 });
    }
    sceneId = crypto.randomUUID();
    statements.push(
      session
        .prepare(
          `INSERT INTO scenes
           (id, place_id, title, latitude, longitude, direction_degrees, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          sceneId,
          placeId,
          input.sceneTitle,
          input.latitude,
          input.longitude,
          input.directionDegrees ?? null,
          actor.actorId,
        ),
    );
  } else if (sceneId) {
    const scene = await session
      .prepare("SELECT id FROM scenes WHERE id = ? AND place_id = ?")
      .bind(sceneId, placeId)
      .first<{ id: string }>();
    if (!scene) return NextResponse.json({ error: "视角与地点不匹配" }, { status: 400 });
  }

  const uploadedKeys: string[] = [];
  const assetRows: Array<{ id: string; key: string; file: File }> = [];
  try {
    for (const file of files) {
      const assetId = crypto.randomUUID();
      const now = new Date();
      const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${memoryId}/${assetId}.${extensionFor(file.type)}`;
      await IMAGES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000" },
        customMetadata: { memoryId, originalName: file.name.slice(0, 200) },
      });
      uploadedKeys.push(key);
      assetRows.push({ id: assetId, key, file });
    }

    statements.push(
      session
        .prepare(
          `INSERT INTO memories
           (id, client_request_id, place_id, scene_id, actor_id, note, latitude, longitude,
            captured_at, weather, temperature, visibility, source, gps_accuracy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          memoryId,
          input.clientRequestId,
          placeId,
          sceneId,
          actor.actorId,
          input.note,
          input.latitude,
          input.longitude,
          input.capturedAt ?? null,
          input.weather ?? null,
          input.temperature ?? null,
          input.visibility,
          input.source,
          input.gpsAccuracy ?? null,
        ),
    );

    assetRows.forEach(({ id, key, file }, index) => {
      statements.push(
        session
          .prepare(
            `INSERT INTO media_assets
             (id, memory_id, r2_key, url, original_name, content_type, byte_size, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            memoryId,
            key,
            `/api/media/${id}`,
            file.name.slice(0, 200),
            file.type,
            file.size,
            index,
          ),
      );
    });

    statements.push(
      session
        .prepare(
          `INSERT INTO audit_events
           (id, actor_id, entity_type, entity_id, action, payload_json)
           VALUES (?, ?, 'memory', ?, 'create', ?)`,
        )
        .bind(
          crypto.randomUUID(),
          actor.actorId,
          memoryId,
          JSON.stringify({ placeId, sceneId, assetCount: files.length }),
        ),
    );

    await session.batch(statements);
  } catch (error) {
    await Promise.all(uploadedKeys.map((key) => IMAGES.delete(key)));
    console.error("memory create failed", error);
    return NextResponse.json({ error: "保存失败，请稍后重试" }, { status: 500 });
  }

  const response = NextResponse.json({
    success: true,
    id: memoryId,
    placeId,
    sceneId,
    bookmark: session.getBookmark(),
  });
  if (actor.cookie) response.headers.append("Set-Cookie", actor.cookie);
  const bookmark = session.getBookmark();
  if (bookmark)
    response.headers.append("Set-Cookie", serializeCookie(BOOKMARK_COOKIE, bookmark, 300));
  return response;
}
