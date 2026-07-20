import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ACTOR_COOKIE,
  consumeAuthLimit,
  createSession,
  DUMMY_PASSWORD_HASH,
  findLegacyActorId,
  readCookie,
  serializeCookie,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "邮箱或密码错误" }, { status: 400 });
  const db = getBindings().DB.withSession("first-primary");
  if (!(await consumeAuthLimit(db, request, "login", parsed.data.email, 10, 15 * 60))) {
    return NextResponse.json({ error: "尝试次数过多，请稍后再试" }, { status: 429 });
  }
  const account = await db
    .prepare(
      "SELECT id, actor_id, password_hash FROM accounts WHERE email = ? AND status = 'active'",
    )
    .bind(parsed.data.email)
    .first<{ id: string; actor_id: string; password_hash: string }>();
  const passwordValid = await verifyPassword(
    parsed.data.password,
    account?.password_hash ?? DUMMY_PASSWORD_HASH,
  );
  if (!account || !passwordValid) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  const session = await createSession(db, account.id);
  const legacyActorId = await findLegacyActorId(db, readCookie(request, ACTOR_COOKIE));
  const statements: D1PreparedStatement[] = [session.statement];
  if (legacyActorId && legacyActorId !== account.actor_id) {
    statements.push(
      db
        .prepare("UPDATE memories SET actor_id = ? WHERE actor_id = ?")
        .bind(account.actor_id, legacyActorId),
      db
        .prepare("UPDATE places SET created_by = ? WHERE created_by = ?")
        .bind(account.actor_id, legacyActorId),
      db
        .prepare("UPDATE scenes SET created_by = ? WHERE created_by = ?")
        .bind(account.actor_id, legacyActorId),
      db
        .prepare("UPDATE audit_events SET actor_id = ? WHERE actor_id = ?")
        .bind(account.actor_id, legacyActorId),
      db.prepare("DELETE FROM actors WHERE id = ?").bind(legacyActorId),
    );
  }
  await db.batch(statements);
  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", serializeCookie(SESSION_COOKIE, session.token));
  response.headers.append("Set-Cookie", serializeCookie(ACTOR_COOKIE, "", 0));
  return response;
}
