import type { Metadata } from "next";
import { UploadConfirm } from "@/components/scene/UploadConfirm";

export const metadata: Metadata = {
  title: "记录这一刻 · 在场",
  description:
    "上传一张照片，写下当时看到、听到、想到的事情。系统会把这条记录自动收录到对应的地点、视角和时间线。",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; placeId?: string; sceneId?: string }>;
}) {
  const { from, placeId, sceneId } = await searchParams;
  const validFrom = from === "place" || from === "scene" ? from : "global";
  return (
    <UploadConfirm from={validFrom} placeId={placeId} sceneId={sceneId} />
  );
}
