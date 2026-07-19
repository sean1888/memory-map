"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Plus, ArrowLeft, Users, X } from "lucide-react";
import { places, type Place, type MemoryEntry } from "@/lib/mockData";

type Screen = "map" | "place";

export function PrototypeApp({
  initialPlaceId,
  initialFilter,
}: {
  initialPlaceId?: string;
  initialFilter?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>(initialFilter ?? "all");

  // 根据 URL 中的 place 参数决定当前屏和当前地点
  const activePlace = initialPlaceId ? places.find((p) => p.id === initialPlaceId) : undefined;
  const screen: Screen = activePlace ? "place" : "map";

  // 切换地点时重置 filter
  useEffect(() => {
    setFilter("all");
  }, [initialPlaceId]);

  const openPlace = (p: Place) => {
    router.push(`/?place=${p.id}`);
  };

  const goHome = () => {
    router.push("/");
  };

  const updateFilter = (f: string) => {
    setFilter(f);
    const params = new URLSearchParams();
    if (initialPlaceId) params.set("place", initialPlaceId);
    if (f !== "all") params.set("filter", f);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar screen={screen} onHome={goHome} onBack={goHome} />

      {screen === "map" && <MapScreen onOpen={openPlace} />}
      {screen === "place" && activePlace && (
        <PlaceScreen place={activePlace} filter={filter} setFilter={updateFilter} />
      )}
    </div>
  );
}

/* ---------- 顶部栏 ---------- */
function TopBar({
  screen,
  onHome,
  onBack,
}: {
  screen: Screen;
  onHome: () => void;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {screen !== "map" ? (
          <button
            onClick={onBack}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> 返回
          </button>
        ) : (
          <button onClick={onHome} className="inline-flex items-center gap-2 text-sm font-medium">
            <MapPin size={16} className="text-accent" />
            <span className="font-editorial text-base">地点记忆</span>
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
            <Link
              href="/upload?from=global"
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-accent px-3 text-sm text-accent-foreground"
            >
              <Plus size={15} />
              <span>记录这一刻</span>
            </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- 地图发现 ---------- */
function MapScreen({ onOpen }: { onOpen: (p: Place) => void }) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl">最近的记忆</h1>
          <p className="mt-1 text-sm text-muted-foreground">6 个地点 · 8 段记录 · 更新于今天</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* 地图 */}
        <div
          className="relative overflow-hidden rounded-[8px] border border-border bg-surface-2"
          style={{ minHeight: 360 }}
        >
          <FauxMap />
          {places.map((p) => (
            <button
              key={p.id}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onOpen(p)}
              className="absolute -translate-x-1/2 -translate-y-full group"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="flex flex-col items-center">
                <span className="inline-flex items-center gap-1 rounded-[8px] bg-background px-2 py-1 text-[11px] shadow-sm border border-border whitespace-nowrap">
                  <MapPin size={11} className="text-accent" />
                  {p.name}
                  <span className="text-muted-foreground">· {p.entries.length}</span>
                </span>
                <span className="mt-0.5 h-2 w-2 rotate-45 bg-accent" />
              </span>
              {hover === p.id && (
                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-foreground px-2 py-1 text-[11px] text-background animate-fade-up">
                  {p.city} · 点击查看
                </span>
              )}
            </button>
          ))}
          {/* 地图图例 */}
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[8px] bg-background/80 px-2 py-1 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            记忆点位（示意地图）
          </div>
        </div>

        {/* 地点列表 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">地点记忆</h2>
            <Link
              href="/upload?from=global"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus size={12} /> 记录这一刻
            </Link>
          </div>
          <ul className="space-y-2">
            {places.map((p) => {
              const first = p.entries[0];
              return (
                <li key={p.id}>
                  <button
                    onClick={() => onOpen(p)}
                    className="flex w-full gap-3 rounded-[8px] border border-border bg-surface p-3 text-left transition-colors hover:border-foreground/40"
                  >
                    <img
                      src={first.photos[0]}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-[8px] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{p.city}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
                        {first.text}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{first.author}</span>
                        <span>·</span>
                        <span>{first.date}</span>
                        {p.entries.length > 1 && (
                          <span className="ml-auto inline-flex items-center gap-1 text-accent">
                            <Users size={11} /> {p.entries.length} 段记忆
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FauxMap() {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* 陆地底色 */}
      <rect width="400" height="260" fill="var(--surface-2)" />
      {/* 不规则水面 — 用曲线而不是矩形 */}
      <path
        d="M 0 145 Q 60 125 120 138 Q 180 150 240 135 Q 300 120 360 140 Q 390 148 400 145 L 400 260 L 0 260 Z"
        fill="rgba(100,140,160,0.10)"
      />
      {/* 岸线 */}
      <path
        d="M 0 145 Q 60 125 120 138 Q 180 150 240 135 Q 300 120 360 140 Q 390 148 400 145"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.8"
        fill="none"
      />
      {/* 有机曲线道路 */}
      <path
        d="M 0 50 Q 80 55 160 42 Q 240 30 320 48 Q 380 58 400 52"
        stroke="rgba(0,0,0,0.09)"
        strokeWidth="0.7"
        fill="none"
      />
      <path
        d="M 0 95 Q 90 88 180 100 Q 270 112 360 95 Q 390 90 400 92"
        stroke="rgba(0,0,0,0.09)"
        strokeWidth="0.7"
        fill="none"
      />
      <path
        d="M 50 0 Q 55 40 48 80 Q 42 110 55 140"
        stroke="rgba(0,0,0,0.07)"
        strokeWidth="0.6"
        fill="none"
      />
      <path
        d="M 170 0 Q 165 45 175 90 Q 182 120 168 140"
        stroke="rgba(0,0,0,0.07)"
        strokeWidth="0.6"
        fill="none"
      />
      <path
        d="M 290 0 Q 298 42 285 85 Q 278 115 295 140"
        stroke="rgba(0,0,0,0.07)"
        strokeWidth="0.6"
        fill="none"
      />
      {/* 建筑块 — 不规则小多边形代替矩形 */}
      {[
        "M 25 25 L 55 22 L 58 45 L 28 48 Z",
        "M 80 30 L 105 28 L 108 52 L 82 55 Z",
        "M 130 22 L 165 20 L 168 48 L 132 50 Z",
        "M 200 28 L 228 25 L 230 50 L 202 52 Z",
        "M 255 24 L 285 22 L 287 48 L 258 50 Z",
        "M 315 30 L 350 28 L 352 55 L 318 57 Z",
        "M 30 70 L 62 68 L 65 92 L 32 94 Z",
        "M 100 75 L 140 72 L 143 98 L 103 100 Z",
        "M 195 70 L 232 68 L 234 95 L 198 97 Z",
        "M 270 75 L 308 73 L 310 98 L 273 100 Z",
        "M 340 72 L 378 70 L 380 96 L 343 98 Z",
        "M 20 165 L 58 162 L 60 195 L 23 197 Z",
        "M 120 170 L 165 168 L 168 200 L 123 202 Z",
        "M 220 175 L 268 172 L 270 208 L 223 210 Z",
        "M 310 168 L 360 165 L 362 200 L 313 202 Z",
      ].map((d, i) => (
        <path key={i} d={d} fill="rgba(0,0,0,0.035)" />
      ))}
      {/* 极淡的地名标注 */}
      <text
        x="90"
        y="115"
        fill="rgba(0,0,0,0.20)"
        fontSize="7"
        fontFamily="serif"
        letterSpacing="2"
      >
        北山街
      </text>
      <text
        x="200"
        y="178"
        fill="rgba(100,140,160,0.35)"
        fontSize="8"
        fontFamily="serif"
        letterSpacing="3"
      >
        西 湖
      </text>
    </svg>
  );
}

/* ---------- 地点详情 ---------- */
function PlaceScreen({
  place,
  filter,
  setFilter,
}: {
  place: Place;
  filter: "all" | string;
  setFilter: (f: "all" | string) => void;
}) {
  const authors = place.entries;
  const shown = filter === "all" ? authors : authors.filter((e) => e.id === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 pb-28">
      {/* 头部 */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">
          <span className="text-accent">●</span> {place.city}
        </p>
        <h1 className="mt-1 font-editorial text-3xl sm:text-4xl">{place.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authors.length} 位朋友在这里留下了 {authors.length} 段记忆
        </p>
        <Link
          href="/scene"
          className="mt-4 text-sm text-accent hover:underline"
        >
          查看这个视角的不同时间 →
        </Link>
      </div>

      {/* 筛选标签 */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border">
        <TabBtn active={filter === "all"} onClick={() => setFilter("all")}>
          全部 · {authors.length}
        </TabBtn>
        {authors.map((e) => (
          <TabBtn key={e.id} active={filter === e.id} onClick={() => setFilter(e.id)}>
            {e.author}的记录
          </TabBtn>
        ))}
      </div>

      {/* 记录 */}
      <div className="space-y-10">
        {shown.map((entry) => (
          <EntryBlock key={entry.id} entry={entry} />
        ))}
      </div>

      {/* 固定底部 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 text-xs text-muted-foreground truncate">
            你也在 {place.name}？记录一次，会自动收录到这个地点和对应的视角时间轴。
          </div>
          <Link
            href={`/upload?from=place&placeId=${place.id}`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[8px] bg-accent px-4 text-sm text-accent-foreground"
          >
            <Plus size={15} />
            记录我在这里的时刻
          </Link>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
        active
          ? "border-accent text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EntryBlock({ entry }: { entry: MemoryEntry }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <article className="animate-fade-up">
      <header className="flex items-center gap-3">
        {/* 印章风格头像 */}
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] bg-accent font-editorial text-sm text-accent-foreground">
          {entry.authorInitial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{entry.author}的记录</div>
          <div className="text-xs text-muted-foreground">
            {entry.date} · {entry.weather} · {entry.temp}
          </div>
        </div>
      </header>

      <p className="mt-4 font-editorial text-[17px] leading-9 text-indent">{entry.text}</p>

      <div className="journal-photos mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {entry.photos.map((src) => (
          <button
            key={src}
            onClick={() => setExpanded(src)}
            className="journal-photo overflow-hidden bg-white p-1.5 shadow-sm aspect-4/3"
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4 animate-fade-up"
          onClick={() => setExpanded(null)}
        >
          <img
            src={expanded}
            alt=""
            className="max-h-[85vh] max-w-[95vw] rounded-[4px] bg-white p-2 shadow-lg object-contain"
          />
          <button
            className="absolute right-4 top-4 rounded-[8px] bg-white/10 p-2 text-white"
            onClick={() => setExpanded(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </article>
  );
}
