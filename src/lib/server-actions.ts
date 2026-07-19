"use server";

import { revalidatePath } from "next/cache";
import type { PlaceRow, MemoryRow, PlaceWithMemories } from "./db";

/**
 * 获取 D1 数据库实例
 *
 * @opennextjs/cloudflare 会把 wrangler bindings 注入到 globalThis
 * 本地开发时通过 wrangler dev 注入
 * 也可以从 process.env 中获取（某些 adapter 版本）
 */
function getDB(): D1Database {
  // 尝试多种方式获取 D1 binding
  const g = globalThis as Record<string, unknown>;
  if (g.DB && typeof (g.DB as D1Database).prepare === "function") {
    return g.DB as D1Database;
  }
  if (g.env && typeof (g.env as Record<string, unknown>).DB === "object") {
    return (g.env as Record<string, D1Database>).DB;
  }
  // Cloudflare Workers 有时通过 __D1_BINDINGS__ 注入
  if (
    g.__D1_BINDINGS__ &&
    typeof (g.__D1_BINDINGS__ as Record<string, D1Database>).DB === "object"
  ) {
    return (g.__D1_BINDINGS__ as Record<string, D1Database>).DB;
  }
  throw new Error(
    "D1 database binding not found. Make sure wrangler.jsonc has d1_databases configured.",
  );
}

/** 设置 D1 实例（由 middleware 或 adapter 调用） */
export async function setDB(db: D1Database) {
  (globalThis as Record<string, unknown>).DB = db;
}

/** 获取所有地点及其记忆数量 */
export async function getPlacesWithMemoryCount(): Promise<PlaceWithMemories[]> {
  const db = getDB();
  const { results: places } = await db
    .prepare(
      `SELECT p.*, COUNT(m.id) as memory_count
       FROM places p LEFT JOIN memories m ON p.id = m.place_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
    )
    .all<PlaceWithMemories & { memory_count: number }>();

  const results: PlaceWithMemories[] = [];
  for (const p of places) {
    const { results: memories } = await db
      .prepare(`SELECT * FROM memories WHERE place_id = ? ORDER BY created_at DESC`)
      .bind(p.id)
      .all<MemoryRow>();
    results.push({ ...p, memories, memory_count: p.memory_count });
  }
  return results;
}

/** 获取单个地点的记忆 */
export async function getPlaceMemories(placeId: string): Promise<MemoryRow[]> {
  const db = getDB();
  const { results } = await db
    .prepare(`SELECT * FROM memories WHERE place_id = ? ORDER BY created_at DESC`)
    .bind(placeId)
    .all<MemoryRow>();
  return results;
}

/** 创建新记忆 */
export async function createMemory(formData: FormData) {
  const db = getDB();

  const id = crypto.randomUUID();
  const placeId = formData.get("placeId") as string;
  const author = formData.get("author") as string;
  const content = formData.get("content") as string;
  const lat = parseFloat(formData.get("latitude") as string);
  const lng = parseFloat(formData.get("longitude") as string);
  const photoUrl = (formData.get("photoUrl") as string) || null;
  const weather = (formData.get("weather") as string) || null;
  const temperature = (formData.get("temperature") as string) || null;

  if (!author || !content) {
    return { success: false, error: "作者和内容不能为空" };
  }

  // 如果地点不存在，自动创建
  const { results: existingPlace } = await db
    .prepare(`SELECT id FROM places WHERE id = ?`)
    .bind(placeId)
    .all();

  if (existingPlace.length === 0 && placeId !== "new") {
    // 使用经纬度反查最近地点（简化：直接创建新地点）
    const { results: nearestPlace } = await db
      .prepare(
        `SELECT id FROM places ORDER BY
         ABS(latitude - ?) + ABS(longitude - ?) ASC LIMIT 1`,
      )
      .bind(lat, lng)
      .all();

    const actualPlaceId =
      nearestPlace.length > 0 ? (nearestPlace[0] as { id: string }).id : placeId;

    await db
      .prepare(
        `INSERT INTO memories (id, place_id, author, author_initial, content, photo_url, latitude, longitude, weather, temperature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, actualPlaceId, author, author[0], content, photoUrl, lat, lng, weather, temperature)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO memories (id, place_id, author, author_initial, content, photo_url, latitude, longitude, weather, temperature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, placeId, author, author[0], content, photoUrl, lat, lng, weather, temperature)
      .run();
  }

  revalidatePath("/");
  return { success: true, id };
}

/** 创建新地点（打卡时如果位置不在已知地点附近） */
export async function createPlace(name: string, city: string, latitude: number, longitude: number) {
  const db = getDB();
  const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
  await db
    .prepare(`INSERT INTO places (id, name, city, latitude, longitude) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, name, city, latitude, longitude)
    .run();
  return { success: true, id };
}
