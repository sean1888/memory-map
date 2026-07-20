import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SceneDesktop } from "@/components/scene/SceneDesktop";
import { BOOKMARK_COOKIE } from "@/lib/auth";
import { getSceneData } from "@/lib/repository";

export const metadata: Metadata = {
  title: "在场 · 同一个视角，不同的时刻",
  description:
    "在杭州北山街的石桥旁向东北看，秋雨、春晴、冬雾，三位记录者在同一个视角上留下了不同的时刻。",
};

export default async function Page() {
  const cookieStore = await cookies();
  const data = await getSceneData(
    cookieStore.get("memory_actor")?.value,
    cookieStore.get(BOOKMARK_COOKIE)?.value,
  );
  if (!data) notFound();
  return <SceneDesktop data={data} />;
}
