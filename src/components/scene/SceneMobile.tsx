"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cloud, Plus, Share2 } from "lucide-react";
import { CompareSlider } from "@/components/scene/CompareSlider";
import type { MemoryDTO, SceneDataDTO } from "@/lib/db";

function imageFor(moment: MemoryDTO) {
  return moment.photos[0] ?? "/assets/upload-photo.jpg";
}

export function SceneMobile({ data }: { data: SceneDataDTO }) {
  const { place, scenes, moments } = data;
  const scene = scenes[0];
  const sceneMoments = moments.filter((moment) => moment.sceneId === scene.id);
  const [leftId, setLeftId] = useState(sceneMoments[0]?.id ?? "");
  const [rightId, setRightId] = useState(sceneMoments[1]?.id ?? sceneMoments[0]?.id ?? "");
  const left = sceneMoments.find((moment) => moment.id === leftId) ?? sceneMoments[0];
  const right =
    sceneMoments.find((moment) => moment.id === rightId) ?? sceneMoments[1] ?? sceneMoments[0];
  const days = useMemo(() => {
    if (!left?.capturedAt || !right?.capturedAt) return 0;
    return Math.abs(
      Math.round(
        (new Date(right.capturedAt).getTime() - new Date(left.capturedAt).getTime()) / 86400000,
      ),
    );
  }, [left, right]);

  const pick = (id: string) => {
    if (id === leftId || id === rightId) return;
    setLeftId(rightId);
    setRightId(id);
  };

  if (!left || !right) {
    return <p className="p-5 text-sm text-muted-foreground">该视角暂无时刻记录。</p>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-105 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur">
          <Link
            href="/scene"
            aria-label="返回"
            className="grid h-9 w-9 place-items-center text-muted-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[15px] font-medium">同景时刻</h1>
          <button
            aria-label="分享"
            className="ml-auto grid h-9 w-9 place-items-center text-muted-foreground"
          >
            <Share2 size={17} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 pt-4">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-accent">●</span> {place.city} · {place.name}
            </p>
            <h2 className="mt-1 font-editorial text-[22px] leading-snug">{scene.title}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {sceneMoments.length} 个时刻 · {scene.direction}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 px-4 text-[12px]">
            <MiniLabel moment={left} />
            <MiniLabel moment={right} align="right" />
          </div>
          <div className="mt-2 px-4">
            <CompareSlider
              leftSrc={imageFor(left)}
              rightSrc={imageFor(right)}
              leftLabel={left.date}
              rightLabel={right.date}
              aspect="4 / 5"
            />
          </div>
          <p className="mt-3 px-4 text-[12px] leading-6 text-muted-foreground">
            同一拍摄点，相隔 {days} 天。拖动滑杆查看光线与景物的变化。
          </p>

          <ul className="mt-4 grid grid-cols-3 gap-2 px-4">
            {sceneMoments.map((moment) => {
              const selected = moment.id === left.id || moment.id === right.id;
              return (
                <li key={moment.id}>
                  <button
                    onClick={() => pick(moment.id)}
                    aria-pressed={selected}
                    className={`block w-full overflow-hidden rounded-[8px] border ${
                      selected ? "border-accent ring-1 ring-accent" : "border-border"
                    }`}
                  >
                    <img
                      src={imageFor(moment)}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                    <div className="truncate px-1.5 py-1 text-left text-[11px]">{moment.date}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </main>

        <div
          className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <div className="mx-auto flex w-full max-w-105 px-4 pt-3">
            <Link
              href={`/upload?from=scene&sceneId=${scene.id}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-accent text-sm text-accent-foreground"
            >
              <Plus size={16} /> 添加这个视角的新时刻
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniLabel({ moment, align = "left" }: { moment: MemoryDTO; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="font-medium">{moment.date}</div>
      <div className="mt-0.5 text-[10.5px] text-muted-foreground">
        {moment.author} · <Cloud size={9} className="inline -mt-0.5" />{" "}
        {moment.weather ?? "天气未知"} {moment.temp}
      </div>
    </div>
  );
}
