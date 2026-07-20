"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Check,
  MapPin,
  Calendar,
  Cloud,
  Compass,
  Info,
  Pencil,
  Users,
  Link2,
  Globe,
  AlertCircle,
  Locate,
  Map as MapIcon,
  X,
  Lock,
  Camera,
} from "lucide-react";
import { place, scene, uploadPhotoUrl } from "@/lib/sceneData";

type ExifState = "success" | "missing";
type SceneChoice = "existing" | "new";
type Visibility = "self" | "participants" | "link" | "public";
type Publish = "idle" | "publishing" | "done";
type EntrySource = "global" | "place" | "scene";
type Coordinates = { latitude: number; longitude: number };

const LocationPickerMap = dynamic(() => import("@/components/map/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-surface-2 text-sm text-muted-foreground">
      地图加载中…
    </div>
  ),
});

const ENTRY_LABEL: Record<EntrySource, string> = {
  global: "从首页记录",
  place: "从「杭州 · 北山街」进入",
  scene: "从「石桥旁向东北看」进入",
};

export function UploadConfirm({
  from = "global",
  placeId,
  sceneId,
}: {
  from?: EntrySource;
  placeId?: string;
  sceneId?: string;
}) {
  const [exif, setExif] = useState<ExifState>("success");
  const [sceneChoice, setSceneChoice] = useState<SceneChoice>(
    from === "scene" ? "existing" : "existing",
  );
  const [visibility, setVisibility] = useState<Visibility>("participants");
  const [note, setNote] = useState(
    "沿着你去年秋天走的那条路又走了一遍，樱花刚开，湖面比照片里亮很多。",
  );
  const [publish, setPublish] = useState<Publish>("idle");
  const [photoUrl, setPhotoUrl] = useState<string>(uploadPhotoUrl);

  const [manualDate, setManualDate] = useState<"exact" | "year" | "unknown">("exact");
  const [manualLocation, setManualLocation] = useState<"current" | "map" | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: scene.latitude,
    longitude: scene.longitude,
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 根据来源决定返回目标
  const backHref = (() => {
    if (from === "scene") return "/scene";
    if (from === "place" && placeId) return `/?place=${placeId}`;
    return "/";
  })();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const doPublish = () => {
    setPublish("publishing");
    setTimeout(() => setPublish("done"), 900);
  };

  const openLocationPicker = () => {
    setManualLocation("map");
    setLocationError(null);
    setShowLocationPicker(true);
  };

  const useCurrentLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("当前浏览器不支持定位，请在地图上选择。");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setManualLocation("current");
        setShowLocationPicker(false);
        setLocating(false);
      },
      () => {
        setLocationError("无法获取当前位置，请检查定位权限或在地图上选择。");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const placeLocked = from === "place" || from === "scene";
  const sceneLocked = from === "scene";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-[560px] pb-32">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/90 backdrop-blur px-3">
          <Link
            href={backHref}
            aria-label="返回"
            className="grid h-9 w-9 place-items-center rounded-[8px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[15px] font-medium">记录这一刻</h1>
          <div className="ml-auto inline-flex rounded-[8px] border border-border p-0.5 text-[11px]">
            <button
              onClick={() => setExif("success")}
              aria-pressed={exif === "success"}
              className={`h-7 rounded-[6px] px-2 ${
                exif === "success" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              EXIF 完整
            </button>
            <button
              onClick={() => setExif("missing")}
              aria-pressed={exif === "missing"}
              className={`h-7 rounded-[6px] px-2 ${
                exif === "missing" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              EXIF 缺失
            </button>
          </div>
        </header>

        {/* Entry context strip */}
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-[8px] border border-border bg-surface px-3 py-2 text-[12px] text-muted-foreground">
          <Info size={12} className="text-accent" />
          <span className="truncate">
            {ENTRY_LABEL[from]}
            {placeLocked && " · 地点已预填"}
            {sceneLocked && " · 视角已预填"}
          </span>
        </div>

        {/* Title */}
        <section className="px-4 pt-4">
          <h2 className="font-editorial text-[22px] leading-snug">
            {exif === "success"
              ? "写下这一刻，其他信息我们帮你补全"
              : "写下这一刻，请补充地点和时间"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            一次发布，会自动收录到你的记录、地点页、视角时间轴和当季记录里。
          </p>
        </section>

        {/* SECTION 1: 照片与文字 */}
        <SectionHeader index="01" title="照片与文字" />
        <section className="px-4">
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            <div
              className="overflow-hidden rounded-[8px] border border-border bg-muted"
              style={{ aspectRatio: "4 / 3" }}
            >
              <img
                src={photoUrl}
                alt="待上传的照片"
                width={1024}
                height={768}
                className="h-full w-full object-cover"
              />
            </div>
          </label>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
            <Camera size={12} />
            <span>
              {photoUrl === uploadPhotoUrl
                ? "示例照片 · 点击可重新选择"
                : "已选择照片 · 点击可更换"}
            </span>
          </div>

          <label className="mt-3 mb-1.5 block text-[13px] font-medium">一段文字</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-[8px] border border-border bg-surface p-3 text-[14px] leading-6 outline-none focus:border-accent"
            placeholder="写下你当时看到、听到、想到的。"
          />
        </section>

        {/* SECTION 2: 拍摄信息 */}
        <SectionHeader index="02" title="拍摄信息" hint="自动识别，可修改" />
        <section className="px-4">
          {exif === "success" ? (
            <ul className="divide-y divide-border rounded-[8px] border border-border bg-surface">
              <InfoRow
                icon={<MapPin size={14} />}
                label="地点"
                value={
                  manualLocation
                    ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
                    : "杭州市北山街"
                }
                editable
                confirmed
                onEdit={openLocationPicker}
              />
              <InfoRow
                icon={<Calendar size={14} />}
                label="时间"
                value="2026.04.12 16:37"
                editable
                confirmed
              />
              <InfoRow
                icon={<Cloud size={14} />}
                label="天气"
                value="晴，19°C"
                editable
                confirmed
              />
              <InfoRow icon={<Locate size={14} />} label="GPS" value="精确到约 12 米" confirmed />
              <li className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-muted-foreground">
                <Info size={12} />
                <span>信息来源：照片 EXIF 和历史天气</span>
              </li>
            </ul>
          ) : (
            <div className="space-y-3">
              <div className="rounded-[8px] border border-border bg-surface p-3">
                <div className="mb-2 flex items-center gap-2 text-[13px] font-medium">
                  <MapPin size={14} className="text-accent" /> 地点
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={useCurrentLocation}
                    disabled={locating}
                    aria-pressed={manualLocation === "current"}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border text-[13px] ${
                      manualLocation === "current"
                        ? "border-accent text-foreground bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Locate size={14} /> {locating ? "定位中…" : "使用我当前的位置"}
                  </button>
                  <button
                    onClick={openLocationPicker}
                    aria-pressed={manualLocation === "map"}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border text-[13px] ${
                      manualLocation === "map"
                        ? "border-accent text-foreground bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MapIcon size={14} /> 在地图上选择
                  </button>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  <span>如果这是旧照片，不要选“使用我当前的位置”。</span>
                </p>
                {manualLocation && (
                  <p className="mt-2 text-[11px] text-foreground">
                    已选择：{coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="rounded-[8px] border border-border bg-surface p-3">
                <div className="mb-2 flex items-center gap-2 text-[13px] font-medium">
                  <Calendar size={14} className="text-accent" /> 时间
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["exact", "精确日期"],
                      ["year", "只填年份"],
                      ["unknown", "设为未知"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setManualDate(k)}
                      aria-pressed={manualDate === k}
                      className={`h-10 rounded-[8px] border text-[13px] ${
                        manualDate === k
                          ? "border-accent text-foreground bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showLocationPicker && (
            <div className="mt-3 overflow-hidden rounded-[8px] border border-border bg-surface">
              <div className="h-[300px] w-full">
                <LocationPickerMap value={coordinates} onChange={setCoordinates} />
              </div>
              <div className="flex items-center gap-3 border-t border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium">点击地图或拖动标记调整位置</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(false)}
                  className="h-9 shrink-0 rounded-[8px] bg-accent px-3 text-[12px] text-accent-foreground"
                >
                  确认此位置
                </button>
              </div>
            </div>
          )}

          {locationError && (
            <p role="alert" className="mt-2 flex items-start gap-1.5 text-[11px] text-accent">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              {locationError}
            </p>
          )}
        </section>

        {/* SECTION 3: 归入哪里 */}
        <SectionHeader
          index="03"
          title="归入哪里"
          hint={sceneLocked ? "已从视角进入，无法更改" : "选择一个视角"}
        />
        <section className="px-4">
          <div className="rounded-[8px] border border-border bg-surface p-3">
            <div className="flex items-start gap-2">
              <Compass size={14} className="mt-0.5 text-accent" />
              <div className="min-w-0">
                <div className="text-[13px] font-medium">系统推荐：加入「{scene.title}」视角</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {exif === "success"
                    ? "高度匹配 · 拍摄点和方向与已有视角接近"
                    : "低置信度 · 请你确认"}
                </div>
              </div>
              {exif === "success" && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,#3f8f4e_10%,transparent)] px-2 py-0.5 text-[11px] text-[#2e6d3b]">
                  <Check size={11} /> 高度匹配
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-[8px] border p-3 ${
                  sceneChoice === "existing"
                    ? "border-accent bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
                    : "border-border"
                } ${sceneLocked ? "opacity-100" : ""}`}
              >
                <input
                  type="radio"
                  name="scene"
                  className="mt-1 accent-[var(--accent)]"
                  checked={sceneChoice === "existing"}
                  onChange={() => setSceneChoice("existing")}
                  disabled={sceneLocked}
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">加入「{scene.title}」时间轴</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    已有 3 个时刻 · 会作为新时刻加入
                  </div>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-[8px] border p-3 ${
                  sceneChoice === "new"
                    ? "border-accent bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
                    : "border-border"
                } ${sceneLocked ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="scene"
                  className="mt-1 accent-[var(--accent)]"
                  checked={sceneChoice === "new"}
                  onChange={() => setSceneChoice("new")}
                  disabled={sceneLocked}
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">在 {place.name} 新建一个视角</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    这张照片会成为新视角的第一个时刻
                  </div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 4: 谁可以看到 */}
        <SectionHeader index="04" title="谁可以看到" />
        <section className="px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <VisTab
              icon={<Lock size={13} />}
              label="仅自己"
              active={visibility === "self"}
              onClick={() => setVisibility("self")}
            />
            <VisTab
              icon={<Users size={13} />}
              label="仅参与者"
              active={visibility === "participants"}
              onClick={() => setVisibility("participants")}
            />
            <VisTab
              icon={<Link2 size={13} />}
              label="持链接可见"
              active={visibility === "link"}
              onClick={() => setVisibility("link")}
            />
            <VisTab
              icon={<Globe size={13} />}
              label="公开"
              active={visibility === "public"}
              onClick={() => setVisibility("public")}
            />
          </div>
        </section>
      </div>

      {/* Sticky publish */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <div className="mx-auto flex w-full max-w-[560px] items-center gap-2 px-4 pt-3">
          <button
            onClick={doPublish}
            disabled={publish === "publishing"}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-accent text-accent-foreground text-sm disabled:opacity-70"
          >
            {publish === "publishing" ? "发布中…" : "发布这段记录"}
          </button>
        </div>
      </div>

      {/* Success sheet */}
      {publish === "done" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 sm:items-center animate-fade-up"
        >
          <div className="w-full max-w-[440px] rounded-t-[16px] sm:rounded-[12px] bg-background p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,#3f8f4e_15%,transparent)] text-[#2e6d3b]">
                <Check size={18} />
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-medium">已发布你的记录</div>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                  同一条记录，会以下列方式出现在不同页面：
                </p>
              </div>
              <button
                aria-label="关闭"
                onClick={() => setPublish("idle")}
                className="ml-auto grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <ul className="mt-4 divide-y divide-border rounded-[8px] border border-border bg-surface">
              <DestRow icon={<Users size={12} />} label="你的个人记录" value="周屿 · 2026 春" />
              <DestRow icon={<MapPin size={12} />} label="地点" value={place.name} />
              <DestRow
                icon={<Compass size={12} />}
                label="视角时间轴"
                value={`${scene.title} · 第 4 个时刻`}
              />
              <DestRow icon={<Cloud size={12} />} label="时间与天气" value="2026 春季 · 晴" />
            </ul>

            <div className="mt-4 flex gap-2">
              <Link
                href="/scene"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-[8px] border border-border text-sm hover:border-foreground/40"
              >
                查看视角时间轴
              </Link>
              <Link
                href={backHref}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-[8px] bg-accent text-accent-foreground text-sm"
              >
                {from === "scene" ? "返回场景" : from === "place" ? "返回地点" : "返回地图"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="mt-6 flex items-baseline gap-2 px-4">
      <span className="font-editorial text-[13px] text-accent">{index}</span>
      <h3 className="text-[14px] font-medium">{title}</h3>
      {hint && <span className="text-[11px] text-muted-foreground">· {hint}</span>}
      <div className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}

function DestRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 px-3 py-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="ml-auto text-[13px] truncate">{value}</span>
    </li>
  );
}

function InfoRow({
  icon,
  label,
  value,
  editable,
  confirmed,
  onEdit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editable?: boolean;
  confirmed?: boolean;
  onEdit?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-[14px] truncate">{value}</div>
      </div>
      {confirmed && (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#2e6d3b]">
          <Check size={12} /> 已识别
        </span>
      )}
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`修改${label}`}
          className="grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground hover:text-foreground"
        >
          <Pencil size={14} />
        </button>
      )}
    </li>
  );
}

function VisTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border text-[13px] ${
        active
          ? "border-accent text-foreground bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
