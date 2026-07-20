import type {
  MemoryDTO,
  MemorySource,
  PlaceDTO,
  SceneDTO,
  SceneDataDTO,
  UploadContextDTO,
  Visibility,
} from "@/lib/db";
import { getDatabase } from "@/lib/cloudflare";
import { findActorId } from "@/lib/auth";

type MemoryRow = {
  id: string;
  place_id: string;
  scene_id: string | null;
  actor_id: string;
  display_name: string;
  note: string;
  latitude: number;
  longitude: number;
  captured_at: string | null;
  created_at: string;
  weather: string | null;
  temperature: number | null;
  visibility: Visibility;
  source: MemorySource;
  gps_accuracy: number | null;
};

type AssetRow = { memory_id: string; url: string };

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(value: string | null): string {
  if (!value) return "时间未知";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function directionLabel(degrees: number | null): string {
  if (degrees === null) return "方向未记录";
  const labels = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  return `${labels[Math.round(degrees / 45) % 8]} ${Math.round(degrees)}°`;
}

async function loadMemories(
  db: D1Database | D1DatabaseSession,
  where: string,
  value: string,
  actorId: string | null,
  options: { limit?: number; cursor?: [string, string] } = {},
): Promise<MemoryDTO[]> {
  const cursorClause = options.cursor
    ? "AND (COALESCE(m.captured_at, m.created_at) < ? OR (COALESCE(m.captured_at, m.created_at) = ? AND m.id < ?))"
    : "";
  const limitClause = options.limit ? "LIMIT ?" : "";
  const bindings: Array<string | number> = [value, actorId ?? ""];
  if (options.cursor) bindings.push(options.cursor[0], options.cursor[0], options.cursor[1]);
  if (options.limit) bindings.push(options.limit);
  const { results } = await db
    .prepare(
      `SELECT m.*, a.display_name
       FROM memories m
       JOIN actors a ON a.id = m.actor_id
       WHERE m.${where} = ? AND m.deleted_at IS NULL
         AND (m.visibility = 'public' OR m.actor_id = ?)
         ${cursorClause}
       ORDER BY COALESCE(m.captured_at, m.created_at) DESC, m.id DESC
       ${limitClause}`,
    )
    .bind(...bindings)
    .all<MemoryRow>();

  if (results.length === 0) return [];
  const placeholders = results.map(() => "?").join(",");
  const { results: assets } = await db
    .prepare(
      `SELECT memory_id, url FROM media_assets
       WHERE memory_id IN (${placeholders}) ORDER BY memory_id, sort_order`,
    )
    .bind(...results.map((memory) => memory.id))
    .all<AssetRow>();

  const photos = new Map<string, string[]>();
  for (const asset of assets) {
    const list = photos.get(asset.memory_id) ?? [];
    list.push(asset.url);
    photos.set(asset.memory_id, list);
  }

  return results.map((memory) => ({
    id: memory.id,
    placeId: memory.place_id,
    sceneId: memory.scene_id,
    author: memory.display_name,
    authorInitial: memory.display_name.slice(0, 1),
    text: memory.note,
    capturedAt: memory.captured_at,
    createdAt: memory.created_at,
    date: formatDate(memory.captured_at),
    weather: memory.weather,
    temperature: memory.temperature,
    temp: memory.temperature === null ? "" : `${memory.temperature}°C`,
    latitude: memory.latitude,
    longitude: memory.longitude,
    visibility: memory.visibility,
    source: memory.source,
    gpsAccuracy: memory.gps_accuracy,
    photos: photos.get(memory.id) ?? [],
    canDelete: actorId === memory.actor_id,
  }));
}

export async function getHomeData(
  activePlaceId?: string,
  actorToken?: string | null,
  bookmark?: string | null,
): Promise<PlaceDTO[]> {
  const db = getDatabase(bookmark);
  const actorId = await findActorId(db, actorToken ?? null);
  const actorKey = actorId ?? "";
  const { results } = await db
    .prepare(
      `SELECT p.*,
        COUNT(m.id) AS memory_count,
        (SELECT m2.id FROM memories m2
         WHERE m2.place_id = p.id AND m2.deleted_at IS NULL
           AND (m2.visibility = 'public' OR m2.actor_id = ?)
         ORDER BY COALESCE(m2.captured_at, m2.created_at) DESC LIMIT 1) AS latest_memory_id
       FROM places p
       LEFT JOIN memories m ON m.place_id = p.id AND m.deleted_at IS NULL
         AND (m.visibility = 'public' OR m.actor_id = ?)
       GROUP BY p.id
       ORDER BY MAX(COALESCE(m.created_at, p.created_at)) DESC`,
    )
    .bind(actorKey, actorKey)
    .all<{
      id: string;
      name: string;
      city: string;
      address: string | null;
      latitude: number;
      longitude: number;
      memory_count: number;
      latest_memory_id: string | null;
    }>();

  const places: PlaceDTO[] = [];
  for (const place of results) {
    const shouldLoadAll = place.id === activePlaceId;
    const entries = shouldLoadAll
      ? await loadMemories(db, "place_id", place.id, actorId)
      : place.latest_memory_id
        ? (await loadMemories(db, "id", place.latest_memory_id, actorId)).slice(0, 1)
        : [];
    places.push({
      id: place.id,
      name: place.name,
      city: place.city,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      memoryCount: Number(place.memory_count),
      entries,
    });
  }
  return places;
}

export async function getSceneData(
  actorToken?: string | null,
  bookmark?: string | null,
): Promise<SceneDataDTO | null> {
  const db = getDatabase(bookmark);
  const actorId = await findActorId(db, actorToken ?? null);
  const actorKey = actorId ?? "";
  const place = await db
    .prepare(
      `SELECT p.* FROM places p
       WHERE EXISTS (SELECT 1 FROM scenes s WHERE s.place_id = p.id)
       ORDER BY p.created_at LIMIT 1`,
    )
    .first<{
      id: string;
      name: string;
      city: string;
      address: string | null;
      latitude: number;
      longitude: number;
    }>();
  if (!place) return null;

  const { results: sceneRows } = await db
    .prepare(
      `SELECT s.*, COUNT(m.id) AS moment_count
       FROM scenes s
       LEFT JOIN memories m ON m.scene_id = s.id AND m.deleted_at IS NULL
         AND (m.visibility = 'public' OR m.actor_id = ?)
       WHERE s.place_id = ?
       GROUP BY s.id ORDER BY s.rowid`,
    )
    .bind(actorKey, place.id)
    .all<{
      id: string;
      place_id: string;
      title: string;
      latitude: number;
      longitude: number;
      direction_degrees: number | null;
      moment_count: number;
    }>();

  const scenes: SceneDTO[] = sceneRows.map((scene) => ({
    id: scene.id,
    placeId: scene.place_id,
    title: scene.title,
    latitude: scene.latitude,
    longitude: scene.longitude,
    directionDegrees: scene.direction_degrees,
    direction: directionLabel(scene.direction_degrees),
    momentCount: Number(scene.moment_count),
  }));

  const moments: MemoryDTO[] = [];
  for (const scene of scenes) {
    moments.push(...(await loadMemories(db, "scene_id", scene.id, actorId)));
  }

  return {
    place: {
      id: place.id,
      name: place.name,
      city: place.city,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      memoryCount: moments.length,
      entries: moments,
    },
    scenes,
    moments,
  };
}

export async function getPlaceMemoryPage(
  placeId: string,
  actorToken?: string | null,
  bookmark?: string | null,
  cursor?: string | null,
  requestedLimit = 20,
) {
  const db = getDatabase(bookmark);
  const actorId = await findActorId(db, actorToken ?? null);
  const limit = Math.min(Math.max(requestedLimit, 1), 50);
  let decodedCursor: [string, string] | undefined;
  if (cursor) {
    try {
      const parsed = JSON.parse(atob(cursor)) as unknown;
      if (Array.isArray(parsed) && parsed.length === 2) {
        decodedCursor = [String(parsed[0]), String(parsed[1])];
      }
    } catch {
      decodedCursor = undefined;
    }
  }
  const rows = await loadMemories(db, "place_id", placeId, actorId, {
    cursor: decodedCursor,
    limit: limit + 1,
  });
  const memories = rows.slice(0, limit);
  const last = memories.at(-1);
  const nextCursor =
    rows.length > limit && last
      ? btoa(JSON.stringify([last.capturedAt ?? last.createdAt, last.id]))
      : null;
  return { memories, nextCursor };
}

export async function getUploadContext(bookmark?: string | null): Promise<UploadContextDTO> {
  const db = getDatabase(bookmark);
  const { results: places } = await db
    .prepare("SELECT id, name, city, latitude, longitude FROM places ORDER BY city, name")
    .all<UploadContextDTO["places"][number]>();
  const { results } = await db.prepare("SELECT * FROM scenes ORDER BY place_id, created_at").all<{
    id: string;
    place_id: string;
    title: string;
    latitude: number;
    longitude: number;
    direction_degrees: number | null;
  }>();
  return {
    places,
    scenes: results.map((scene) => ({
      id: scene.id,
      placeId: scene.place_id,
      title: scene.title,
      latitude: scene.latitude,
      longitude: scene.longitude,
      directionDegrees: scene.direction_degrees,
      direction: directionLabel(scene.direction_degrees),
      momentCount: 0,
    })),
  };
}
