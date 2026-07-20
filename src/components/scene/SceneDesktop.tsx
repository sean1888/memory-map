"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, Camera, Cloud, Compass, MapPin, Plus, Smartphone, Users } from "lucide-react";
import { CompareSlider } from "@/components/scene/CompareSlider";
import type { MemoryDTO, SceneDataDTO } from "@/lib/db";

const SceneMapboxMap = dynamic(() => import("@/components/map/SceneMapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-surface-2 text-sm text-muted-foreground">
      地图加载中…
    </div>
  ),
});

type Mode = "single" | "compare" | "all";

function imageFor(moment: MemoryDTO) {
  return moment.photos[0] ?? "/assets/upload-photo.jpg";
}

function daysBetween(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  return Math.abs(Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function SceneDesktop({ data }: { data: SceneDataDTO }) {
  const { place, scenes, moments } = data;
  const firstScene = scenes[0];
  const firstMoments = moments.filter((moment) => moment.sceneId === firstScene.id);
  const [activeSceneId, setActiveSceneId] = useState(firstScene.id);
  const [mode, setMode] = useState<Mode>("compare");
  const [leftId, setLeftId] = useState(firstMoments[0]?.id ?? "");
  const [rightId, setRightId] = useState(firstMoments[1]?.id ?? firstMoments[0]?.id ?? "");
  const [singleId, setSingleId] = useState(firstMoments[0]?.id ?? "");

  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? firstScene;
  const sceneMoments = moments.filter((moment) => moment.sceneId === activeSceneId);
  const left = sceneMoments.find((moment) => moment.id === leftId) ?? sceneMoments[0];
  const right =
    sceneMoments.find((moment) => moment.id === rightId) ?? sceneMoments[1] ?? sceneMoments[0];
  const single = sceneMoments.find((moment) => moment.id === singleId) ?? sceneMoments[0];
  const days = useMemo(
    () => (left && right ? daysBetween(left.capturedAt, right.capturedAt) : 0),
    [left, right],
  );

  const selectScene = (id: string) => {
    const nextMoments = moments.filter((moment) => moment.sceneId === id);
    setActiveSceneId(id);
    setLeftId(nextMoments[0]?.id ?? "");
    setRightId(nextMoments[1]?.id ?? nextMoments[0]?.id ?? "");
    setSingleId(nextMoments[0]?.id ?? "");
  };

  const pickForCompare = (moment: MemoryDTO) => {
    if (moment.id === leftId || moment.id === rightId) return;
    setLeftId(rightId);
    setRightId(moment.id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar sceneId={activeSceneId} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <section className="self-start lg:sticky lg:top-20">
            <MapPanel data={data} activeSceneId={activeSceneId} onSceneChange={selectScene} />
          </section>

          <section>
            <header className="mb-5">
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} className="text-accent" />
                {place.city} · {place.name}
              </p>
              <h1 className="mt-1.5 font-editorial text-3xl leading-tight sm:text-[34px]">
                {activeScene.title}
              </h1>
              <p className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Compass size={12} /> {activeScene.direction}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={12} /> {sceneMoments.length} 个时刻
                </span>
              </p>
            </header>

            <div
              role="tablist"
              aria-label="查看方式"
              className="mb-4 inline-flex rounded-[8px] border border-border bg-surface p-1 text-sm"
            >
              {(["single", "compare", "all"] as const).map((value) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`h-8 rounded-sm px-3 ${
                    mode === value
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {{ single: "单张浏览", compare: "双图比较", all: "全部时刻" }[value]}
                </button>
              ))}
            </div>

            {sceneMoments.length === 0 ? (
              <p className="rounded-[8px] border border-border p-5 text-sm text-muted-foreground">
                该视角暂无时刻记录。
              </p>
            ) : mode === "compare" && left && right ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <MomentHeader moment={left} />
                  <MomentHeader moment={right} align="right" />
                </div>
                <CompareSlider
                  leftSrc={imageFor(left)}
                  rightSrc={imageFor(right)}
                  leftLabel={left.date}
                  rightLabel={right.date}
                />
                <p className="mt-3 text-xs text-muted-foreground">同一拍摄点 · 相隔 {days} 天</p>
                <MomentPicker
                  moments={sceneMoments}
                  selectedIds={[left.id, right.id]}
                  onPick={pickForCompare}
                />
              </>
            ) : mode === "single" && single ? (
              <>
                <MomentHeader moment={single} />
                <img
                  src={imageFor(single)}
                  alt={single.date}
                  className="mt-3 aspect-3/2 w-full rounded-[8px] border border-border object-cover"
                />
                <p className="mt-3 text-[15px] leading-8">{single.text}</p>
                <MomentPicker
                  moments={sceneMoments}
                  selectedIds={[single.id]}
                  onPick={(moment) => setSingleId(moment.id)}
                />
              </>
            ) : (
              <div className="space-y-8">
                {sceneMoments.map((moment) => (
                  <article key={moment.id}>
                    <MomentHeader moment={moment} />
                    <img
                      src={imageFor(moment)}
                      alt={moment.date}
                      className="mt-3 aspect-3/2 w-full rounded-[8px] border border-border object-cover"
                    />
                    <p className="mt-3 text-[15px] leading-8">{moment.text}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function MomentPicker({
  moments,
  selectedIds,
  onPick,
}: {
  moments: MemoryDTO[];
  selectedIds: string[];
  onPick: (moment: MemoryDTO) => void;
}) {
  return (
    <ul className="mt-5 grid grid-cols-3 gap-2">
      {moments.map((moment) => (
        <li key={moment.id}>
          <button
            onClick={() => onPick(moment)}
            aria-pressed={selectedIds.includes(moment.id)}
            className={`block w-full overflow-hidden rounded-[8px] border ${
              selectedIds.includes(moment.id) ? "border-accent ring-1 ring-accent" : "border-border"
            }`}
          >
            <img src={imageFor(moment)} alt="" className="aspect-square w-full object-cover" />
            <div className="truncate px-2 py-1.5 text-left text-[11px]">{moment.date}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MomentHeader({ moment, align = "left" }: { moment: MemoryDTO; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="text-[13px] font-medium">{moment.date}</div>
      <div
        className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground"
        style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
      >
        <span>{moment.author}</span>
        <span className="inline-flex items-center gap-1">
          <Cloud size={11} /> {moment.weather ?? "天气未知"} {moment.temp}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar size={11} /> {moment.date}
        </span>
      </div>
    </div>
  );
}

function TopBar({ sceneId }: { sceneId: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-editorial text-base">在场</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            同一个视角，不同的时刻
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/m" className="hidden h-9 items-center gap-1.5 px-2 sm:inline-flex">
            <Smartphone size={14} /> 手机视图
          </Link>
          <Link
            href={`/upload?from=scene&sceneId=${sceneId}`}
            className="inline-flex h-9 items-center gap-1.5 px-2"
          >
            <Camera size={14} /> 记录这一刻
          </Link>
        </nav>
      </div>
    </header>
  );
}

function MapPanel({
  data,
  activeSceneId,
  onSceneChange,
}: {
  data: SceneDataDTO;
  activeSceneId: string;
  onSceneChange: (id: string) => void;
}) {
  const { place, scenes } = data;
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-[8px] border border-border bg-surface-2">
        <SceneMapboxMap
          center={{ latitude: place.latitude, longitude: place.longitude }}
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneChange={onSceneChange}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-[8px] bg-background/85 px-2 py-1 text-[11px] text-muted-foreground">
          {activeScene.momentCount} 个时刻
        </div>
      </div>
      <div className="mt-3 rounded-[8px] border border-border bg-surface p-3 text-xs leading-6 text-muted-foreground">
        <div className="flex items-center gap-1.5 text-foreground">
          <MapPin size={12} className="text-accent" />
          <span className="font-medium">
            {place.city} · {place.name}
          </span>
        </div>
        <p className="mt-1">{place.address}</p>
        <p className="mt-2">
          当前视角：<span className="text-foreground">{activeScene.title}</span>
        </p>
      </div>
      <Link
        href={`/upload?from=scene&sceneId=${activeSceneId}`}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] bg-accent text-sm text-accent-foreground"
      >
        <Plus size={15} /> 添加这个视角的新时刻
      </Link>
    </div>
  );
}
