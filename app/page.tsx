import { cookies } from "next/headers";
import { PrototypeApp } from "@/components/PrototypeApp";
import { BOOKMARK_COOKIE } from "@/lib/auth";
import { getHomeData } from "@/lib/repository";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; filter?: string }>;
}) {
  const { place, filter } = await searchParams;
  const cookieStore = await cookies();
  const places = await getHomeData(
    place,
    cookieStore.get("memory_actor")?.value,
    cookieStore.get(BOOKMARK_COOKIE)?.value,
  );
  return <PrototypeApp places={places} initialPlaceId={place} initialFilter={filter} />;
}
