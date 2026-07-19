import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Plus,
  ArrowLeft,
  Users,
  Camera,
  Cloud,
  Calendar,
  X,
  MessageCircle,
  Heart,
} from "lucide-react";
import { places, primaryPlace, type Place, type MemoryEntry } from "@/lib/mockData";
import { schemes, type SchemeId } from "@/lib/schemes";

type Screen = "map" | "place";

export function PrototypeApp({ schemeId }: { schemeId: SchemeId }) {
  const scheme = schemes[schemeId];
  const [screen, setScreen] = useState<Screen>("map");
  const [activePlace, setActivePlace] = useState<Place>(primaryPlace);
  const [filter, setFilter] = useState<"all" | string>("all");

  const openPlace = (p: Place) => {
    setActivePlace(p);
    setFilter("all");
    setScreen("place");
  };

  return (
    <div className={`scheme-${schemeId} min-h-screen bg-background text-foreground`}>
      <TopBar
        scheme={scheme.name}
        schemeId={schemeId}
        onHome={() => setScreen("map")}
        screen={screen}
        onBack={() => setScreen("map")}
      />

      {screen === "map" && (
        <MapScreen schemeId={schemeId} onOpen={openPlace} />
      )}
      {screen === "place" && (
        <PlaceScreen
          schemeId={schemeId}
          place={activePlace}
          filter={filter}
          setFilter={setFilter}
        />
      )}
    </div>
  );
}

/* ---------- Top bar ---------- */
function TopBar({
  scheme,
  schemeId,
  screen,
  onHome,
  onBack,
}: {
  scheme: string;
  schemeId: SchemeId;
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
          <button
            onClick={onHome}
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            <MapPin size={16} className="text-accent" />
            <span className={schemeId === "a" ? "font-editorial text-base" : ""}>
              地点记忆
            </span>
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/schemes"
            className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground"
          >
            方案 {schemeId.toUpperCase()} · {scheme} ↗
          </Link>
          <Link
            to="/upload"
            search={{ from: "global" }}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-accent-solid px-3 text-sm"
          >
            <Plus size={15} />
            <span>记录这一刻</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- 1. Map discovery ---------- */
function MapScreen({
  schemeId,
  onOpen,
}: {
  schemeId: SchemeId;
  onOpen: (p: Place) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const bMap = schemeId === "b";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1
            className={
              schemeId === "a"
                ? "font-editorial text-2xl sm:text-3xl"
                : "text-xl sm:text-2xl font-medium"
            }
          >
            最近的记忆
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            6 个地点 · 8 段记录 · 更新于今天
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Map */}
        <div
          className={`relative overflow-hidden rounded-[8px] border border-border ${
            bMap ? "bg-surface-2" : "bg-surface-2"
          }`}
          style={{ minHeight: 360 }}
        >
          <FauxMap schemeId={schemeId} />
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
          {/* map footer */}
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[8px] bg-background/80 px-2 py-1 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            记忆点位（示意地图）
          </div>
        </div>

        {/* List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">地点记忆</h2>
            <Link
              to="/upload"
              search={{ from: "global" }}
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
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {p.city}
                        </span>
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

function FauxMap({ schemeId }: { schemeId: SchemeId }) {
  const stroke =
    schemeId === "b" ? "rgba(230,230,227,0.10)" : "rgba(0,0,0,0.08)";
  const block =
    schemeId === "b" ? "rgba(230,230,227,0.05)" : "rgba(0,0,0,0.04)";
  const water =
    schemeId === "b"
      ? "rgba(111,154,106,0.10)"
      : schemeId === "a"
      ? "rgba(181,58,43,0.05)"
      : "rgba(15,37,68,0.06)";
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <rect x="0" y="140" width="400" height="120" fill={water} />
      {[
        [20, 20, 80, 40],
        [110, 30, 60, 50],
        [180, 20, 70, 40],
        [260, 30, 50, 30],
        [320, 20, 60, 50],
        [30, 90, 70, 30],
        [110, 90, 90, 30],
        [220, 90, 60, 30],
        [290, 90, 90, 30],
        [40, 180, 100, 40],
        [160, 190, 80, 30],
        [260, 180, 120, 50],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={block} rx="2" />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1="0"
          x2="400"
          y1={i * 35 + 5}
          y2={i * 35 + 5}
          stroke={stroke}
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={`v${i}`}
          y1="0"
          y2="260"
          x1={i * 45 + 10}
          x2={i * 45 + 10}
          stroke={stroke}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/* ---------- 2. Place detail ---------- */
function PlaceScreen({
  schemeId,
  place,
  filter,
  setFilter,
}: {
  schemeId: SchemeId;
  place: Place;
  filter: "all" | string;
  setFilter: (f: "all" | string) => void;
}) {
  const authors = place.entries;
  const shown =
    filter === "all" ? authors : authors.filter((e) => e.id === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 pb-28">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">
          <span className="text-accent">●</span> {place.city}
        </p>
        <h1
          className={
            schemeId === "a"
              ? "mt-1 font-editorial text-3xl sm:text-4xl"
              : "mt-1 text-2xl sm:text-3xl font-medium"
          }
        >
          {place.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authors.length} 位朋友在这里留下了 {authors.length} 段记忆
        </p>
        <Link
          to="/scene"
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 text-sm hover:border-foreground/40"
        >
          <Camera size={14} className="text-accent" />
          查看这个视角的不同时间
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border">
        <TabBtn active={filter === "all"} onClick={() => setFilter("all")}>
          全部 · {authors.length}
        </TabBtn>
        {authors.map((e) => (
          <TabBtn
            key={e.id}
            active={filter === e.id}
            onClick={() => setFilter(e.id)}
          >
            {e.author}的记录
          </TabBtn>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-10">
        {shown.map((entry) => (
          <EntryBlock key={entry.id} entry={entry} schemeId={schemeId} />
        ))}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 text-xs text-muted-foreground truncate">
            你也在 {place.name}？记录一次，会自动收录到这个地点和对应的视角时间轴。
          </div>
          <Link
            to="/upload"
            search={{ from: "place", placeId: place.id }}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[8px] bg-accent-solid px-4 text-sm"
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

function EntryBlock({
  entry,
  schemeId,
}: {
  entry: MemoryEntry;
  schemeId: SchemeId;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const bStyle = schemeId === "b";

  return (
    <article className="animate-fade-up">
      <header className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-medium"
          style={{
            background: "var(--color-muted)",
            color: "var(--color-foreground)",
          }}
        >
          {entry.authorInitial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{entry.author}的记录</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} /> {entry.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Cloud size={11} /> {entry.weather} · {entry.temp}
            </span>
          </div>
        </div>
      </header>

      <p
        className={`mt-4 text-[15px] leading-8 ${
          schemeId === "a" ? "font-editorial text-[17px] leading-9" : ""
        }`}
      >
        {entry.text}
      </p>

      <div
        className={`mt-4 grid gap-2 ${
          bStyle
            ? "grid-cols-2 sm:grid-cols-3"
            : entry.photos.length >= 5
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {entry.photos.map((src, i) => (
          <button
            key={src}
            onClick={() => setExpanded(src)}
            className={`overflow-hidden rounded-[8px] border border-border bg-muted ${
              i === 0 && bStyle ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/3]"
            }`}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <button className="inline-flex items-center gap-1 hover:text-foreground">
          <Heart size={13} /> 12
        </button>
        <button className="inline-flex items-center gap-1 hover:text-foreground">
          <MessageCircle size={13} /> 3
        </button>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 animate-fade-up"
          onClick={() => setExpanded(null)}
        >
          <img
            src={expanded}
            alt=""
            className="max-h-[85vh] max-w-[95vw] rounded-[8px] object-contain"
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
