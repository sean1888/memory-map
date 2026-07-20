import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SceneMobile } from "@/components/scene/SceneMobile";
import { BOOKMARK_COOKIE, SESSION_COOKIE } from "@/lib/auth";
import { getSceneData } from "@/lib/repository";

export const metadata: Metadata = {
  title: "同景时刻 · 在场",
  description: "手机端同景时刻比较视图。",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; scene?: string }>;
}) {
  const { place, scene } = await searchParams;
  if (!place) notFound();
  const cookieStore = await cookies();
  const data = await getSceneData(
    place,
    cookieStore.get(SESSION_COOKIE)?.value,
    cookieStore.get(BOOKMARK_COOKIE)?.value,
  );
  if (!data || data.scenes.length === 0) notFound();
  return <SceneMobile data={data} initialSceneId={scene} />;
}
