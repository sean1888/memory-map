export const ACTOR_COOKIE = "memory_actor";
export const SESSION_COOKIE = "memory_session";
export const BOOKMARK_COOKIE = "d1_bookmark";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 600_000;
export const DUMMY_PASSWORD_HASH =
  "pbkdf2_sha256$600000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export type CurrentUser = {
  accountId: string;
  actorId: string;
  username: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
};

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

export function serializeCookie(name: string, value: string, maxAge = SESSION_MAX_AGE): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export function createToken(size = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(size)));
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validatePassword(password: string): string | null {
  if (password.length < 6 || password.length > 18) return "密码长度需为 6-18 位";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "密码需同时包含字母和数字";
  if (
    ["password", "password1", "123456", "12345678", "qwerty123", "abc123"].includes(
      password.toLowerCase(),
    )
  ) {
    return "这个密码过于常见，请换一个";
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterationsValue, saltValue, expectedValue] = stored.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsValue || !saltValue || !expectedValue)
    return false;
  const iterations = Number(iterationsValue);
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 1_000_000) return false;
  const salt = new Uint8Array(fromBase64Url(saltValue));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256),
  );
  const expected = fromBase64Url(expectedValue);
  if (bits.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < bits.length; index += 1) difference |= bits[index] ^ expected[index];
  return difference === 0;
}

export async function findLegacyActorId(
  db: D1Database | D1DatabaseSession,
  token: string | null,
): Promise<string | null> {
  if (!token) return null;
  const row = await db
    .prepare("SELECT id FROM actors WHERE token_hash = ? AND is_anonymous = 1")
    .bind(await hashToken(token))
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function getCurrentUser(
  db: D1Database | D1DatabaseSession,
  token: string | null,
): Promise<CurrentUser | null> {
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT s.account_id, a.actor_id, r.username, r.display_name, a.email,
            a.email_verified_at, r.avatar_r2_key
     FROM sessions s JOIN accounts a ON a.id = s.account_id
     JOIN actors r ON r.id = a.actor_id
     WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND a.status = 'active'`,
    )
    .bind(await hashToken(token))
    .first<{
      account_id: string;
      actor_id: string;
      username: string;
      display_name: string;
      email: string;
      email_verified_at: string | null;
      avatar_r2_key: string | null;
    }>();
  if (!row) return null;
  return {
    accountId: row.account_id,
    actorId: row.actor_id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    emailVerified: Boolean(row.email_verified_at),
    avatarUrl: row.avatar_r2_key ? `/api/avatars/${row.actor_id}` : null,
  };
}

export async function requireUser(
  db: D1Database | D1DatabaseSession,
  request: Request,
): Promise<CurrentUser | null> {
  return getCurrentUser(db, readCookie(request, SESSION_COOKIE));
}

export async function createSession(
  db: D1Database | D1DatabaseSession,
  accountId: string,
): Promise<{ token: string; statement: D1PreparedStatement }> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  return {
    token,
    statement: db
      .prepare("INSERT INTO sessions (id, account_id, token_hash, expires_at) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), accountId, await hashToken(token), expiresAt),
  };
}

export async function consumeAuthLimit(
  db: D1Database | D1DatabaseSession,
  request: Request,
  scope: string,
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const key = await hashToken(`${scope}:${ip}:${identity.toLowerCase()}`);
  const row = await db
    .prepare("SELECT attempts, window_started_at FROM auth_rate_limits WHERE key = ?")
    .bind(key)
    .first<{ attempts: number; window_started_at: string }>();
  const expired =
    !row ||
    Date.now() - new Date(`${row.window_started_at.replace(" ", "T")}Z`).getTime() >=
      windowSeconds * 1000;
  const attempts = expired ? 1 : row.attempts + 1;
  await db
    .prepare(
      `INSERT INTO auth_rate_limits (key, attempts, window_started_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET attempts = excluded.attempts,
         window_started_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE auth_rate_limits.window_started_at END`,
    )
    .bind(key, attempts, expired ? 1 : 0)
    .run();
  return attempts <= limit;
}

export function getSessionToken(request: Request): string | null {
  return readCookie(request, SESSION_COOKIE);
}

export function getActorToken(request: Request): string | null {
  return getSessionToken(request);
}

export async function findActorId(
  db: D1Database | D1DatabaseSession,
  token: string | null,
): Promise<string | null> {
  return (await getCurrentUser(db, token))?.actorId ?? null;
}
