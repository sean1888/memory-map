import { createFileRoute } from "@tanstack/react-router";
import { PrototypeApp } from "@/components/PrototypeApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "在场 · 地点记忆地图" },
      {
        name: "description",
        content:
          "在地图上的某个地点留下文字、照片和时间。朋友来到同一个地点后，可以看到你的记录，并添加自己的版本。",
      },
      { property: "og:title", content: "在场 · 地点记忆地图" },
      {
        property: "og:description",
        content: "同一个地点，不同人不同时间的记忆版本。",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => <PrototypeApp schemeId="a" />,
});
