import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Compass, Calendar, Cloud, Users, Plus, Smartphone, Camera } from "lucide-react";
import { CompareSlider } from "@/components/scene/CompareSlider";
import {
  place,
  scenes,
  scene as defaultScene,
  moments,
  daysBetween,
  type Moment,
} from "@/lib/sceneData";

type Mode = "single" | "compare" | "all";

export function SceneDesktop() {
  const [activeSceneId, setActiveSceneId] = useState<string>(defaultScene.id);
  const [mode, setMode] = useState<Mode>("compare");
  const [leftId, setLeftId] = useState<string>("m-autumn");
  const [rightId, setRightId] = useState<string>("m-spring");
  const [singleId, setSingleId] = useState<string>("m-autumn");

  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? defaultScene;
  const sceneMoments = moments.filter((m) => m.sceneId === activeSceneId);

  const left = sceneMoments.find((m) => m.id === leftId) ?? sceneMoments[0];
  const right = sceneMoments.find((m) => m.id === rightId) ?? sceneMoments[1] ?? sceneMoments[0];
  const single = sceneMoments.find((m) => m.id === singleId) ?? sceneMoments[0];

  const days = useMemo(
    () => (left && right ? daysBetween(left.isoDate, right.isoDate) : 0),
    [left, right],
  );

  const pickForCompare = (m: Moment) => {
    if (m.id === leftId || m.id === rightId) return;
    setLeftId(rightId);
    setRightId(m.id);
  };

  if (!left || !right || !single) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <p className="text-muted-foreground">该视角暂无时刻记录。</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          {/* Left: map */}
          <section className="lg:sticky lg:top-20 self-start">
            <MapPanel activeSceneId={activeSceneId} onSceneChange={setActiveSceneId} />
          </section>

          {/* Right: scene details */}
          <section>
            <header className="mb-5">
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <MapPin size={12} className="text-accent" />
                {place.name}
              </p>
              <h1 className="mt-1.5 font-editorial text-3xl sm:text-[34px] leading-tight">
                {activeScene.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground inline-flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Compass size={12} /> {activeScene.direction}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={12} /> {sceneMoments.length} 个时刻，{sceneMoments.length} 位记录者
                </span>
              </p>
            </header>

            {/* Mode switcher */}
            <div
              role="tablist"
              aria-label="查看方式"
              className="mb-4 inline-flex rounded-[8px] border border-border bg-surface p-1 text-sm"
            >
              <ModeTab active={mode === "single"} onClick={() => setMode("single")}>
                单张浏览
              </ModeTab>
              <ModeTab active={mode === "compare"} onClick={() => setMode("compare")}>
                双图比较
              </ModeTab>
              <ModeTab active={mode === "all"} onClick={() => setMode("all")}>
                全部时刻
              </ModeTab>
            </div>

            {mode === "compare" && (
              <>
                <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                  <MomentHeader m={left} />
                  <MomentHeader m={right} align="right" />
                </div>

                <CompareSlider
                  leftSrc={left.imageUrl}
                  rightSrc={right.imageUrl}
                  leftLabel={left.shortLabel}
                  rightLabel={right.shortLabel}
                />

                <p className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>· 同一拍摄点</span>
                  <span>· 同一方向</span>
                  <span>· 视角偏差约 3°</span>
                  <span>· 相隔 {days} 天</span>
                </p>

                <div className="mt-5">
                  <p className="mb-2 text-xs text-muted-foreground">选择两个时刻进行比较</p>
                  <ul className="grid grid-cols-3 gap-2">
                    {sceneMoments.map((m) => {
                      const selected = m.id === leftId || m.id === rightId;
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => pickForCompare(m)}
                            aria-pressed={selected}
                            className={`group block w-full overflow-hidden rounded-[8px] border text-left transition-colors ${
                              selected
                                ? "border-accent ring-1 ring-accent bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
                                : "border-border hover:border-foreground/40"
                            }`}
                          >
                            <div className="aspect-4/3 w-full overflow-hidden bg-muted">
                              <img
                                src={m.imageUrl}
                                alt={m.shortLabel}
                                loading="lazy"
                                width={800}
                                height={600}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="px-2.5 py-2">
                              <div className="text-[13px] font-medium truncate">{m.shortLabel}</div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                                {m.author} · {m.weather} {m.temperature}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            {mode === "single" && (
              <>
                <div className="mb-3">
                  <MomentHeader m={single} />
                </div>
                <div
                  className="overflow-hidden rounded-[8px] border border-border bg-muted"
                  style={{ aspectRatio: "3 / 2" }}
                >
                  <img
                    src={single.imageUrl}
                    alt={single.shortLabel}
                    width={1200}
                    height={800}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-4 text-[15px] leading-8">{single.note}</p>

                <ul className="mt-5 grid grid-cols-3 gap-2">
                  {sceneMoments.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => setSingleId(m.id)}
                        aria-pressed={m.id === singleId}
                        className={`block w-full overflow-hidden rounded-[8px] border transition-colors ${
                          m.id === singleId
                            ? "border-accent ring-1 ring-accent"
                            : "border-border hover:border-foreground/40"
                        }`}
                      >
                        <div className="aspect-4/3 bg-muted">
                          <img
                            src={m.imageUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="px-2 py-1.5 text-left">
                          <div className="text-[12px] truncate">{m.shortLabel}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {mode === "all" && (
              <div className="space-y-8">
                {sceneMoments.map((m) => (
                  <article key={m.id}>
                    <MomentHeader m={m} />
                    <div
                      className="mt-3 overflow-hidden rounded-[8px] border border-border bg-muted"
                      style={{ aspectRatio: "3 / 2" }}
                    >
                      <img
                        src={m.imageUrl}
                        alt={m.shortLabel}
                        loading="lazy"
                        width={1200}
                        height={800}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-3 text-[15px] leading-8">{m.note}</p>
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

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-8 whitespace-nowrap rounded-sm px-3 transition-colors ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function MomentHeader({ m, align = "left" }: { m: Moment; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="text-[13px] font-medium">{m.shortLabel}</div>
      <div
        className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground"
        style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
      >
        <span>{m.author}</span>
        <span className="inline-flex items-center gap-1">
          <Cloud size={11} /> {m.weather} {m.temperature}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar size={11} /> {m.capturedAt.split(" · ")[0]}
        </span>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-editorial text-base">在场</span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            同一个视角，不同的时刻
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/m"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2 hover:text-foreground"
          >
            <Smartphone size={14} /> 手机视图
          </Link>
          <Link
            to="/upload"
            search={{ from: "scene", sceneId: "shiqiao-ne" }}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2 hover:text-foreground"
          >
            <Camera size={14} /> 记录这一刻
          </Link>
        </nav>
      </div>
    </header>
  );
}

function MapPanel({
  activeSceneId,
  onSceneChange,
}: {
  activeSceneId: string;
  onSceneChange: (id: string) => void;
}) {
  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? defaultScene;
  const activeMomentCount = moments.filter((m) => m.sceneId === activeSceneId).length;

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[8px] border border-border bg-surface-2"
        style={{ aspectRatio: "4 / 3" }}
      >
        <FauxLakeMap />
        {scenes.map((s) => {
          const active = s.id === activeSceneId;
          const positions: Record<string, { x: number; y: number }> = {
            "shiqiao-ne": { x: 42, y: 58 },
            duanqiao: { x: 62, y: 44 },
            baodi: { x: 30, y: 38 },
          };
          const pos = positions[s.id] ?? { x: 50, y: 50 };
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSceneChange(s.id)}
              className="absolute -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-105 transition-transform"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              aria-label={`切换到视角：${s.title}`}
              aria-pressed={active}
            >
              <span className="flex flex-col items-center">
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[8px] border bg-background px-2 py-1 text-[11px] shadow-sm ${
                    active ? "border-accent text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  <MapPin size={11} className={active ? "text-accent" : ""} />
                  {s.title}
                  <span className="text-muted-foreground">
                    · {moments.filter((m) => m.sceneId === s.id).length}
                  </span>
                </span>
                <span
                  className={`mt-0.5 h-2 w-2 rotate-45 ${active ? "bg-accent" : "bg-muted-foreground/70"}`}
                />
              </span>
            </button>
          );
        })}
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[8px] bg-background/85 px-2 py-1 text-[11px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {activeMomentCount} 个时刻，{activeMomentCount} 位记录者
        </div>
      </div>
      <div className="mt-3 rounded-[8px] border border-border bg-surface p-3 text-xs text-muted-foreground leading-6">
        <div className="flex items-center gap-1.5 text-foreground">
          <MapPin size={12} className="text-accent" />
          <span className="font-medium">{place.name}</span>
        </div>
        <p className="mt-1">{place.address}</p>
        <p className="mt-2">
          当前视角：<span className="text-foreground">{activeScene.title}</span>
        </p>
      </div>
      <Link
        to="/upload"
        search={{ from: "scene", sceneId: activeSceneId }}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] bg-accent text-accent-foreground text-sm hover:opacity-90"
      >
        <Plus size={15} /> 添加这个视角的新时刻
      </Link>
    </div>
  );
}

function FauxLakeMap() {
  // Very abstract West Lake shore illustration: no external map API.
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* land */}
      <rect x="0" y="0" width="400" height="300" fill="rgba(0,0,0,0.03)" />
      {/* lake */}
      <path
        d="M 60 150 Q 120 90 220 100 T 380 170 L 380 300 L 60 300 Z"
        fill="rgba(181,58,43,0.05)"
      />
      {/* shoreline */}
      <path
        d="M 60 150 Q 120 90 220 100 T 380 170"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1.2"
        fill="none"
      />
      {/* road along shore */}
      <path
        d="M 40 165 Q 130 110 230 118 T 380 190"
        stroke="rgba(181,58,43,0.55)"
        strokeWidth="1.4"
        fill="none"
        strokeDasharray="4 3"
      />
      {/* street grid on land */}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1="0"
          x2="400"
          y1={i * 22 + 10}
          y2={i * 22 + 10}
          stroke="rgba(0,0,0,0.06)"
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 42} x2={i * 42} y1="0" y2="140" stroke="rgba(0,0,0,0.06)" />
      ))}
    </svg>
  );
}
