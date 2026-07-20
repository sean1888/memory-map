const ACTOR_COOKIE = "memory_actor";
export const BOOKMARK_COOKIE = "d1_bookmark";

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const item of header?.split(";") ?? []) {
    const separator = item.indexOf("=");
    if (separator === -1) continue;
    cookies.set(
      item.slice(0, separator).trim(),
      decodeURIComponent(item.slice(separator + 1).trim()),
    );
  }
  return cookies;
}

export function readCookie(request: Request, name: string): string | null {
  return parseCookies(request.headers.get("cookie")).get(name) ?? null;
}

export function serializeCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 365): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function findActorId(
  db: D1Database | D1DatabaseSession,
  token: string | null,
): Promise<string | null> {
  if (!token) return null;
  const row = await db
    .prepare("SELECT id FROM actors WHERE token_hash = ?")
    .bind(await hashToken(token))
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function ensureActor(
  db: D1Database | D1DatabaseSession,
  request: Request,
  displayName: string,
): Promise<{ actorId: string; cookie?: string }> {
  const existingToken = readCookie(request, ACTOR_COOKIE);
  const existingId = await findActorId(db, existingToken);
  if (existingId) {
    await db
      .prepare("UPDATE actors SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(displayName, existingId)
      .run();
    return { actorId: existingId };
  }

  const token = createToken();
  const actorId = crypto.randomUUID();
  await db
    .prepare("INSERT INTO actors (id, token_hash, display_name) VALUES (?, ?, ?)")
    .bind(actorId, await hashToken(token), displayName)
    .run();
  return { actorId, cookie: serializeCookie(ACTOR_COOKIE, token) };
}

export function getActorToken(request: Request): string | null {
  return readCookie(request, ACTOR_COOKIE);
}
