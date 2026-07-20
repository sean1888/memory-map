import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";

export const metadata: Metadata = { title: "个人中心 · 在场" };
export default async function Page() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const db = getBindings().DB;
  const user = await getCurrentUser(db, token ?? null);
  if (!user) redirect("/login?next=%2Fprofile");
  const { results } = await db
    .prepare(
      `SELECT m.id, m.note, m.visibility, m.created_at, m.captured_at, p.name AS place_name, (SELECT url FROM media_assets WHERE memory_id = m.id ORDER BY sort_order LIMIT 1) AS cover FROM memories m JOIN places p ON p.id = m.place_id WHERE m.actor_id = ? AND m.deleted_at IS NULL ORDER BY COALESCE(m.captured_at, m.created_at) DESC`,
    )
    .bind(user.actorId)
    .all<{
      id: string;
      note: string;
      visibility: string;
      created_at: string;
      captured_at: string | null;
      place_name: string;
      cover: string | null;
    }>();
  return <ProfileClient initialUser={user} initialMemories={results} />;
}
