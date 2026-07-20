import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ACTOR_COOKIE,
  consumeAuthLimit,
  createSession,
  createToken,
  findLegacyActorId,
  hashPassword,
  hashToken,
  readCookie,
  serializeCookie,
  SESSION_COOKIE,
  validatePassword,
} from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

const schema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .regex(/^[\p{L}\p{N}_-]+$/u),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    const passwordError = validatePassword(value.password);
    if (passwordError)
      context.addIssue({ code: "custom", path: ["password"], message: passwordError });
    if (value.password !== value.confirmPassword)
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "两次输入的密码不一致",
      });
  });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "注册信息有误" },
      { status: 400 },
    );
  const { DB } = getBindings();
  const db = DB.withSession("first-primary");
  const { username, email, password } = parsed.data;
  if (!(await consumeAuthLimit(db, request, "register", email, 5, 60 * 60))) {
    return NextResponse.json({ error: "注册尝试过于频繁，请稍后再试" }, { status: 429 });
  }
  const duplicate = await db
    .prepare(
      "SELECT (SELECT 1 FROM accounts WHERE email = ?) AS email_taken, (SELECT 1 FROM actors WHERE username = ? COLLATE NOCASE) AS username_taken",
    )
    .bind(email, username)
    .first<{ email_taken: number | null; username_taken: number | null }>();
  if (duplicate?.email_taken) return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  if (duplicate?.username_taken)
    return NextResponse.json({ error: "该用户名已被使用" }, { status: 409 });

  const legacyActorId = await findLegacyActorId(db, readCookie(request, ACTOR_COOKIE));
  const actorId = legacyActorId ?? crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const session = await createSession(db, accountId);
  const statements: D1PreparedStatement[] = [];
  if (legacyActorId) {
    statements.push(
      db
        .prepare(
          "UPDATE actors SET username = ?, display_name = ?, is_anonymous = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .bind(username, username, actorId),
    );
  } else {
    const legacyToken = createToken();
    statements.push(
      db
        .prepare(
          "INSERT INTO actors (id, token_hash, display_name, username, is_anonymous) VALUES (?, ?, ?, ?, 0)",
        )
        .bind(actorId, await hashToken(legacyToken), username, username),
    );
  }
  statements.push(
    db
      .prepare("INSERT INTO accounts (id, actor_id, email, password_hash) VALUES (?, ?, ?, ?)")
      .bind(accountId, actorId, email, await hashPassword(password)),
    session.statement,
  );
  try {
    await db.batch(statements);
  } catch {
    return NextResponse.json({ error: "邮箱或用户名已被使用" }, { status: 409 });
  }
  const response = NextResponse.json({
    success: true,
    user: { username, displayName: username, email },
  });
  response.headers.append("Set-Cookie", serializeCookie(SESSION_COOKIE, session.token));
  response.headers.append("Set-Cookie", serializeCookie(ACTOR_COOKIE, "", 0));
  return response;
}
