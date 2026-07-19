import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PrototypeApp } from "@/components/PrototypeApp";

const searchSchema = z.object({
  place: z.string().optional(),
  filter: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "在场 · 地点记忆地图" },
      {
        name: "description",
        content:
          "在地图上的某个地点留下文字、照片和时间。朋友来到同一个地点后，可以看到你的记录，并添加自己的版本。",
      },
      { property: "og:title", content: "在场 · 地点记忆地图" },
      { property: "og:description", content: "同一个地点，不同人不同时间的记忆版本。" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { place: placeId, filter } = Route.useSearch();
  return <PrototypeApp initialPlaceId={placeId} initialFilter={filter} />;
}
