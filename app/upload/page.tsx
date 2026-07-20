import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UploadConfirm } from "@/components/scene/UploadConfirm";
import { BOOKMARK_COOKIE, getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { getUploadContext } from "@/lib/repository";

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
  const cookieStore = await cookies();
  const user = await getCurrentUser(
    getBindings().DB,
    cookieStore.get(SESSION_COOKIE)?.value ?? null,
  );
  if (!user) {
    const params = new URLSearchParams({ from: validFrom });
    if (placeId) params.set("placeId", placeId);
    if (sceneId) params.set("sceneId", sceneId);
    redirect(`/login?next=${encodeURIComponent(`/upload?${params}`)}`);
  }
  const context = await getUploadContext(cookieStore.get(BOOKMARK_COOKIE)?.value);
  return <UploadConfirm context={context} from={validFrom} placeId={placeId} sceneId={sceneId} />;
}
