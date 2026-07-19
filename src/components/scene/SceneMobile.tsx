import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Share2, Plus, Cloud } from "lucide-react";
import { CompareSlider } from "@/components/scene/CompareSlider";
import { place, scene, moments, daysBetween } from "@/lib/sceneData";

export function SceneMobile() {
  const [leftId, setLeftId] = useState("m-autumn");
  const [rightId, setRightId] = useState("m-spring");

  const left = moments.find((m) => m.id === leftId)!;
  const right = moments.find((m) => m.id === rightId)!;
  const days = useMemo(() => daysBetween(left.isoDate, right.isoDate), [left, right]);

  const pick = (id: string) => {
    if (id === leftId || id === rightId) return;
    setLeftId(rightId);
    setRightId(id);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Frame emulating a phone */}
      <div className="mx-auto flex w-full max-w-105 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/90 backdrop-blur px-3">
          <Link
            to="/"
            aria-label="返回"
            className="grid h-9 w-9 place-items-center rounded-[8px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[15px] font-medium">同景时刻</h1>
          <button
            aria-label="分享"
            className="ml-auto grid h-9 w-9 place-items-center rounded-[8px] text-muted-foreground hover:text-foreground"
          >
            <Share2 size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 pt-4">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-accent">●</span> {place.name}
            </p>
            <h2 className="mt-1 font-editorial text-[22px] leading-snug">{scene.title}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">3 个时刻 · {scene.direction}</p>
          </div>

          <div className="mt-3 px-4">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <MiniLabel m={left} />
              <MiniLabel m={right} align="right" />
            </div>
          </div>

          <div className="mt-2 px-4">
            <CompareSlider
              leftSrc={left.imageUrl}
              rightSrc={right.imageUrl}
              leftLabel={left.shortLabel}
              rightLabel={right.shortLabel}
              aspect="4 / 5"
            />
          </div>

          <p className="mt-3 px-4 text-[12px] leading-6 text-muted-foreground">
            同一棵树，相隔 {days} 天。拖动滑杆查看叶色、光线和湖面的变化。
          </p>

          <div className="mt-4 px-4">
            <p className="mb-2 text-[11px] text-muted-foreground">选择两个时刻</p>
            <ul className="grid grid-cols-3 gap-2">
              {moments.map((m) => {
                const selected = m.id === leftId || m.id === rightId;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => pick(m.id)}
                      aria-pressed={selected}
                      className={`block w-full overflow-hidden rounded-[8px] border ${
                        selected ? "border-accent ring-1 ring-accent" : "border-border"
                      }`}
                    >
                      <div className="aspect-square bg-muted">
                        <img
                          src={m.imageUrl}
                          alt={m.shortLabel}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="px-1.5 py-1 text-left">
                        <div className="truncate text-[11px]">{m.shortLabel}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Fixed bottom CTA */}
        <div
          className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <div className="mx-auto flex w-full max-w-105 items-center gap-2 px-4 pt-3">
            <Link
              to="/upload"
              search={{ from: "scene", sceneId: "shiqiao-ne" }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-accent text-accent-foreground text-sm"
            >
              <Plus size={16} />
              添加这个视角的新时刻
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniLabel({
  m,
  align = "left",
}: {
  m: (typeof moments)[number];
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="font-medium">{m.shortLabel}</div>
      <div className="mt-0.5 text-[10.5px] text-muted-foreground">
        {m.author} · <Cloud size={9} className="inline -mt-0.5" /> {m.weather} {m.temperature}
      </div>
    </div>
  );
}
