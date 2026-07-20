"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, Plus, ArrowLeft, Users, X, Trash2 } from "lucide-react";
import type { MemoryDTO, PlaceDTO } from "@/lib/db";
import CheckInForm from "@/components/CheckInForm";

// SSR 安全导入 Mapbox 地图组件
const MapboxMap = dynamic(() => import("@/components/map/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div
      className="relative overflow-hidden rounded-[8px] border border-border bg-surface-2"
      style={{ minHeight: 480 }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        地图加载中…
      </div>
    </div>
  ),
});

type Screen = "map" | "place";

export function PrototypeApp({
  places,
  initialPlaceId,
  initialFilter,
}: {
  places: PlaceDTO[];
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

  const openPlace = (p: PlaceDTO) => {
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

      {screen === "map" && <MapScreen places={places} onOpen={openPlace} />}
      {screen === "place" && activePlace && (
        <PlaceScreen
          place={activePlace}
          filter={filter}
          setFilter={updateFilter}
          onDeleted={() => router.refresh()}
        />
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
function MapScreen({ places, onOpen }: { places: PlaceDTO[]; onOpen: (p: PlaceDTO) => void }) {
  const router = useRouter();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [checkInCoords, setCheckInCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [checkInPlaceId, setCheckInPlaceId] = useState<string | undefined>();

  // 将 places 转换为 MapboxMap 需要的格式
  const mapPlaces = places.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    latitude: p.latitude,
    longitude: p.longitude,
    memoryCount: p.memoryCount,
  }));

  const handleMapDblClick = (lng: number, lat: number) => {
    // 找到最近的已知地点
    let nearest: PlaceDTO | null = null;
    let minDist = Infinity;
    for (const p of places) {
      const dist = Math.sqrt((p.latitude - lat) ** 2 + (p.longitude - lng) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }
    setCheckInPlaceId(nearest && minDist < 0.5 ? nearest.id : undefined);
    setCheckInCoords({ lng, lat });
  };

  const handleCheckInSuccess = () => {
    setCheckInCoords(null);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl">最近的记忆</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {places.length} 个地点 · {places.reduce((sum, place) => sum + place.memoryCount, 0)}{" "}
            段记录
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* 左侧：Mapbox 真实地图 */}
        <MapboxMap
          places={mapPlaces}
          onPlaceClick={(id) => {
            const place = places.find((p) => p.id === id);
            if (place) onOpen(place);
          }}
          onMapDblClick={handleMapDblClick}
          selectedPlaceId={selectedPlaceId}
        />

        {/* 右侧：侧边栏列表 */}
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
              if (!first) return null;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setSelectedPlaceId(p.id);
                      onOpen(p);
                    }}
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
                        {p.memoryCount > 1 && (
                          <span className="ml-auto inline-flex items-center gap-1 text-accent">
                            <Users size={11} /> {p.memoryCount} 段记忆
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

      {/* 打卡表单弹窗 */}
      {checkInCoords && (
        <CheckInForm
          latitude={checkInCoords.lat}
          longitude={checkInCoords.lng}
          placeId={checkInPlaceId}
          onClose={() => setCheckInCoords(null)}
          onSuccess={handleCheckInSuccess}
        />
      )}
    </div>
  );
}

/* ---------- 地点详情 ---------- */
function PlaceScreen({
  place,
  filter,
  setFilter,
  onDeleted,
}: {
  place: PlaceDTO;
  filter: "all" | string;
  setFilter: (f: "all" | string) => void;
  onDeleted: () => void;
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
        <Link href="/scene" className="mt-4 text-sm text-accent hover:underline">
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
          <EntryBlock key={entry.id} entry={entry} onDeleted={onDeleted} />
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

function EntryBlock({ entry, onDeleted }: { entry: MemoryDTO; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteEntry = async () => {
    if (!window.confirm("确定删除这段记录和已上传的图片吗？")) return;
    setDeleting(true);
    const response = await fetch(`/api/memories/${entry.id}`, { method: "DELETE" });
    setDeleting(false);
    if (response.ok) onDeleted();
  };

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
            {[entry.date, entry.weather, entry.temp].filter(Boolean).join(" · ")}
          </div>
        </div>
        {entry.canDelete && (
          <button
            type="button"
            onClick={deleteEntry}
            disabled={deleting}
            className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground hover:text-accent disabled:opacity-50"
            aria-label="删除记录"
          >
            <Trash2 size={15} />
          </button>
        )}
      </header>

      <p className="mt-4 font-editorial text-[17px] leading-9 text-indent">{entry.text}</p>

      {entry.photos.length > 0 && (
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
      )}

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
