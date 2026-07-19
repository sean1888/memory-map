import { createFileRoute } from "@tanstack/react-router";
import { SceneMobile } from "@/components/scene/SceneMobile";

export const Route = createFileRoute("/m")({
  head: () => ({
    meta: [
      { title: "同景时刻 · 在场" },
      { name: "description", content: "手机端同景时刻比较视图。" },
    ],
  }),
  component: SceneMobile,
});
