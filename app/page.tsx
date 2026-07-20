import { cookies } from "next/headers";
import { PrototypeApp } from "@/components/PrototypeApp";
import { BOOKMARK_COOKIE, getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { getHomeData, getUploadContext } from "@/lib/repository";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; filter?: string; draftLat?: string; draftLng?: string }>;
}) {
  const { place, filter, draftLat, draftLng } = await searchParams;
  const cookieStore = await cookies();
  const bookmark = cookieStore.get(BOOKMARK_COOKIE)?.value;
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const [places, uploadContext, user] = await Promise.all([
    getHomeData(place, sessionToken, bookmark),
    getUploadContext(bookmark),
    getCurrentUser(getBindings().DB, sessionToken ?? null),
  ]);
  return (
    <PrototypeApp
      places={places}
      uploadContext={uploadContext}
      initialPlaceId={place}
      initialFilter={filter}
      user={user}
      initialDraftCoordinates={
        Number.isFinite(Number(draftLat)) && Number.isFinite(Number(draftLng))
          ? { latitude: Number(draftLat), longitude: Number(draftLng) }
          : undefined
      }
    />
  );
}
