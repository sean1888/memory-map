import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SceneMobile } from "@/components/scene/SceneMobile";
import { BOOKMARK_COOKIE } from "@/lib/auth";
import { getSceneData } from "@/lib/repository";

export const metadata: Metadata = {
  title: "同景时刻 · 在场",
  description: "手机端同景时刻比较视图。",
};

export default async function Page() {
  const cookieStore = await cookies();
  const data = await getSceneData(
    cookieStore.get("memory_actor")?.value,
    cookieStore.get(BOOKMARK_COOKIE)?.value,
  );
  if (!data) notFound();
  return <SceneMobile data={data} />;
}
