import { PrototypeApp } from "@/components/PrototypeApp";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; filter?: string }>;
}) {
  const { place, filter } = await searchParams;
  return <PrototypeApp initialPlaceId={place} initialFilter={filter} />;
}
