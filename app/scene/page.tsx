import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SceneDesktop } from "@/components/scene/SceneDesktop";
import { BOOKMARK_COOKIE, SESSION_COOKIE } from "@/lib/auth";
import { getSceneData } from "@/lib/repository";

export const metadata: Metadata = {
  title: "在场 · 同一个视角，不同的时刻",
  description: "查看同一地点在不同时间留下的记录，并比较相同视角里的变化。",
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
  if (!data) notFound();
  return <SceneDesktop data={data} initialSceneId={scene} />;
}
