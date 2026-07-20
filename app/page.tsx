import { cookies } from "next/headers";
import { PrototypeApp } from "@/components/PrototypeApp";
import { BOOKMARK_COOKIE } from "@/lib/auth";
import { getHomeData, getUploadContext } from "@/lib/repository";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; filter?: string }>;
}) {
  const { place, filter } = await searchParams;
  const cookieStore = await cookies();
  const bookmark = cookieStore.get(BOOKMARK_COOKIE)?.value;
  const [places, uploadContext] = await Promise.all([
    getHomeData(place, cookieStore.get("memory_actor")?.value, bookmark),
    getUploadContext(bookmark),
  ]);
  return (
    <PrototypeApp
      places={places}
      uploadContext={uploadContext}
      initialPlaceId={place}
      initialFilter={filter}
    />
  );
}
