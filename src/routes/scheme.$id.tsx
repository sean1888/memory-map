import { createFileRoute, notFound } from "@tanstack/react-router";
import { PrototypeApp } from "@/components/PrototypeApp";
import { schemes, type SchemeId } from "@/lib/schemes";

export const Route = createFileRoute("/scheme/$id")({
  component: SchemePage,
  head: ({ params }) => {
    const s = schemes[(params as { id: SchemeId }).id];
    const title = s ? `方案 ${s.id.toUpperCase()} · ${s.name}` : "方案";
    return {
      meta: [
        { title: `${title} — 地点记忆地图` },
        { name: "description", content: s?.description ?? "设计方案预览" },
      ],
    };
  },
});

function SchemePage() {
  const { id } = Route.useParams();
  if (id !== "a" && id !== "b" && id !== "c") throw notFound();
  return <PrototypeApp schemeId={id} />;
}
