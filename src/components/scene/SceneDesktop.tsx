"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
const OTHER_GROUP_ID = "other-place-memories";

function imageFor(moment: MemoryDTO) {
  return moment.photos[0] ?? "/assets/upload-photo.jpg";
}

function daysBetween(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  return Math.abs(Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function SceneDesktop({
  data,
  initialSceneId,
}: {
  data: SceneDataDTO;
  initialSceneId?: string;
}) {
  const router = useRouter();
  const { place, scenes, moments } = data;
  const unassignedMoments = moments.filter((moment) => moment.sceneId === null);
  const requestedScene = scenes.find((scene) => scene.id === initialSceneId);
  const mostActiveScene = [...scenes].sort(
    (first, second) => second.momentCount - first.momentCount,
  )[0];
  const preferredScene =
    requestedScene ??
    (mostActiveScene && (mostActiveScene.momentCount > 0 || unassignedMoments.length === 0)
      ? mostActiveScene
      : undefined);
  const initialGroupId = preferredScene?.id ?? OTHER_GROUP_ID;
  const initialMoments = preferredScene
    ? moments.filter((moment) => moment.sceneId === preferredScene.id)
    : unassignedMoments;
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId);
  const [mode, setMode] = useState<Mode>(
    preferredScene && initialMoments.length >= 2 ? "compare" : preferredScene ? "single" : "all",
  );
  const [leftId, setLeftId] = useState(initialMoments[0]?.id ?? "");
  const [rightId, setRightId] = useState(initialMoments[1]?.id ?? initialMoments[0]?.id ?? "");
  const [singleId, setSingleId] = useState(initialMoments[0]?.id ?? "");

  const activeScene = scenes.find((scene) => scene.id === activeGroupId);
  const sceneMoments = activeScene
    ? moments.filter((moment) => moment.sceneId === activeScene.id)
    : unassignedMoments;
  const left = sceneMoments.find((moment) => moment.id === leftId) ?? sceneMoments[0];
  const right =
    sceneMoments.find((moment) => moment.id === rightId) ?? sceneMoments[1] ?? sceneMoments[0];
  const single = sceneMoments.find((moment) => moment.id === singleId) ?? sceneMoments[0];
  const days = useMemo(
    () => (left && right ? daysBetween(left.capturedAt, right.capturedAt) : 0),
    [left, right],
  );

  const selectGroup = (id: string) => {
    const nextScene = scenes.find((scene) => scene.id === id);
    const nextMoments = nextScene
      ? moments.filter((moment) => moment.sceneId === id)
      : unassignedMoments;
    setActiveGroupId(id);
    setLeftId(nextMoments[0]?.id ?? "");
    setRightId(nextMoments[1]?.id ?? nextMoments[0]?.id ?? "");
    setSingleId(nextMoments[0]?.id ?? "");
    setMode(nextScene && nextMoments.length >= 2 ? "compare" : nextScene ? "single" : "all");
    router.replace(
      nextScene ? `/scene?place=${place.id}&scene=${nextScene.id}` : `/scene?place=${place.id}`,
      { scroll: false },
    );
  };

  const pickForCompare = (moment: MemoryDTO) => {
    if (moment.id === leftId || moment.id === rightId) return;
    setLeftId(rightId);
    setRightId(moment.id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar placeId={place.id} sceneId={activeScene?.id} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <section className="self-start lg:sticky lg:top-20">
            <MapPanel
              data={data}
              activeSceneId={activeScene?.id}
              activeMomentCount={sceneMoments.length}
              onSceneChange={selectGroup}
            />
          </section>

          <section>
            <header className="mb-5">
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} className="text-accent" />
                {place.city} · {place.name}
              </p>
              <h1 className="mt-1.5 font-editorial text-3xl leading-tight sm:text-[34px]">
                {activeScene?.title ?? "其他地点记录"}
              </h1>
              <p className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Compass size={12} /> {activeScene?.direction ?? "未归入具体视角"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={12} /> {sceneMoments.length} 个时刻
                </span>
              </p>
            </header>

            {scenes.length + (unassignedMoments.length > 0 ? 1 : 0) > 1 && (
              <label className="mb-4 block max-w-sm text-xs font-medium text-muted-foreground">
                记录范围
                <select
                  value={activeGroupId}
                  onChange={(event) => selectGroup(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground"
                >
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.title} · {scene.momentCount} 个时刻
                    </option>
                  ))}
                  {unassignedMoments.length > 0 && (
                    <option value={OTHER_GROUP_ID}>
                      其他地点记录 · {unassignedMoments.length} 条
                    </option>
                  )}
                </select>
              </label>
            )}

            <div
              role="tablist"
              aria-label="查看方式"
              className="mb-4 inline-flex rounded-[8px] border border-border bg-surface p-1 text-sm"
            >
              {(activeScene && sceneMoments.length >= 2
                ? (["single", "compare", "all"] as const)
                : (["single", "all"] as const)
              ).map((value) => (
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
                {activeScene ? "该视角暂无时刻记录。" : "这个地点还没有未归入视角的记录。"}
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

function TopBar({ placeId, sceneId }: { placeId: string; sceneId?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href={`/?place=${placeId}`} className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-editorial text-base">在场</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            同一个视角，不同的时刻
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          {sceneId && (
            <Link
              href={`/m?place=${placeId}&scene=${sceneId}`}
              className="hidden h-9 items-center gap-1.5 px-2 sm:inline-flex"
            >
              <Smartphone size={14} /> 手机视图
            </Link>
          )}
          <Link
            href={
              sceneId
                ? `/upload?from=scene&sceneId=${sceneId}`
                : `/upload?from=place&placeId=${placeId}`
            }
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
  activeMomentCount,
  onSceneChange,
}: {
  data: SceneDataDTO;
  activeSceneId?: string;
  activeMomentCount: number;
  onSceneChange: (id: string) => void;
}) {
  const { place, scenes } = data;
  const activeScene = scenes.find((scene) => scene.id === activeSceneId);
  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-[8px] border border-border bg-surface-2">
        <SceneMapboxMap
          center={{ latitude: place.latitude, longitude: place.longitude }}
          scenes={scenes}
          activeSceneId={activeSceneId ?? null}
          onSceneChange={onSceneChange}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-[8px] bg-background/85 px-2 py-1 text-[11px] text-muted-foreground">
          {activeMomentCount} 个时刻
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
          当前范围：
          <span className="text-foreground">{activeScene?.title ?? "其他地点记录"}</span>
        </p>
      </div>
      <Link
        href={
          activeScene
            ? `/upload?from=scene&sceneId=${activeScene.id}`
            : `/upload?from=place&placeId=${place.id}`
        }
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] bg-accent text-sm text-accent-foreground"
      >
        <Plus size={15} /> {activeScene ? "添加这个视角的新时刻" : "在这个地点记录新时刻"}
      </Link>
    </div>
  );
}
