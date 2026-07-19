import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { UploadConfirm } from "@/components/scene/UploadConfirm";

const searchSchema = z.object({
  from: z.enum(["global", "place", "scene"]).optional().default("global"),
  placeId: z.string().optional(),
  sceneId: z.string().optional(),
});

export const Route = createFileRoute("/upload")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "记录这一刻 · 在场" },
      {
        name: "description",
        content:
          "上传一张照片，写下当时看到、听到、想到的事情。系统会把这条记录自动收录到对应的地点、视角和时间线。",
      },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const search = Route.useSearch();
  return <UploadConfirm from={search.from} />;
}
