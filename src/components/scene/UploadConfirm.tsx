"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Compass, Locate, MapPin } from "lucide-react";
import { ImageDropzone } from "@/components/upload/ImageDropzone";
import type { UploadContextDTO, Visibility } from "@/lib/db";

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

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function UploadConfirm({
  context,
  from = "global",
  placeId,
  sceneId,
}: {
  context: UploadContextDTO;
  from?: EntrySource;
  placeId?: string;
  sceneId?: string;
}) {
  const router = useRouter();
  const initialScene = context.scenes.find((scene) => scene.id === sceneId);
  const initialPlace =
    context.places.find((place) => place.id === (initialScene?.placeId ?? placeId)) ??
    context.places[0];

  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState("");
  const [note, setNote] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState(initialPlace?.id ?? "new");
  const [selectedSceneId, setSelectedSceneId] = useState(initialScene?.id ?? "");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [direction, setDirection] = useState("");
  const [capturedAt, setCapturedAt] = useState(toLocalInput(new Date()));
  const [weather, setWeather] = useState("");
  const [temperature, setTemperature] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: initialScene?.latitude ?? initialPlace?.latitude ?? 30.2569,
    longitude: initialScene?.longitude ?? initialPlace?.longitude ?? 120.1451,
  });
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableScenes = useMemo(
    () => context.scenes.filter((scene) => scene.placeId === selectedPlaceId),
    [context.scenes, selectedPlaceId],
  );
  const lockedPlace = from === "place" || from === "scene";
  const lockedScene = from === "scene";
  const backHref =
    from === "scene" ? "/scene" : from === "place" && placeId ? `/?place=${placeId}` : "/";

  const updatePlace = (id: string) => {
    setSelectedPlaceId(id);
    setSelectedSceneId("");
    const place = context.places.find((item) => item.id === id);
    if (place) setCoordinates({ latitude: place.latitude, longitude: place.longitude });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("当前浏览器不支持定位，请在地图上选择。");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError("无法获取当前位置，请检查定位权限。");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async () => {
    setError(null);
    if (!author.trim() || !note.trim()) {
      setError("请填写署名和文字。");
      return;
    }
    if (files.length === 0) {
      setError("请至少选择一张图片。");
      return;
    }

    const formData = new FormData();
    formData.set("clientRequestId", crypto.randomUUID());
    formData.set("author", author.trim());
    formData.set("note", note.trim());
    formData.set("placeId", selectedPlaceId);
    formData.set("latitude", String(coordinates.latitude));
    formData.set("longitude", String(coordinates.longitude));
    formData.set("capturedAt", new Date(capturedAt).toISOString());
    formData.set("visibility", visibility);
    formData.set("source", "manual");
    if (weather.trim()) formData.set("weather", weather.trim());
    if (temperature) formData.set("temperature", temperature);
    if (selectedPlaceId === "new") {
      formData.set("placeName", newPlaceName.trim());
      formData.set("city", newCity.trim());
    }
    if (selectedSceneId) formData.set("sceneId", selectedSceneId);
    if (selectedSceneId === "new") {
      formData.set("sceneTitle", newSceneTitle.trim());
      if (direction) formData.set("directionDegrees", direction);
    }
    files.forEach((file) => formData.append("photos", file));

    setSubmitting(true);
    try {
      const response = await fetch("/api/memories", { method: "POST", body: formData });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        placeId?: string;
        sceneId?: string;
      };
      if (!response.ok || !result.success) {
        setError(result.error ?? "发布失败，请稍后重试。");
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push(result.sceneId ? "/scene" : `/?place=${result.placeId}`);
        router.refresh();
      }, 700);
    } catch {
      setError("网络错误，请重试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-[620px] pb-28">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur">
          <Link href={backHref} aria-label="返回" className="grid h-9 w-9 place-items-center">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[15px] font-medium">记录这一刻</h1>
        </header>

        <Section index="01" title="照片与文字">
          <ImageDropzone
            files={files}
            onChange={(nextFiles) => {
              setFiles(nextFiles);
              if (files.length === 0 && nextFiles[0]) {
                setCapturedAt(toLocalInput(new Date(nextFiles[0].lastModified)));
              }
            }}
          />
          <label className="mt-4 block text-[13px] font-medium">
            你的名字
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              maxLength={30}
              className="mt-1.5 w-full rounded-[8px] border border-border bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>
          <label className="mt-3 block text-[13px] font-medium">
            一段文字
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-[8px] border border-border bg-surface p-3 leading-6 outline-none focus:border-accent"
            />
          </label>
        </Section>

        <Section index="02" title="地点与视角">
          <label className="block text-[13px] font-medium">
            地点
            <select
              value={selectedPlaceId}
              disabled={lockedPlace}
              onChange={(event) => updatePlace(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-[8px] border border-border bg-surface px-3 disabled:opacity-60"
            >
              {context.places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.city} · {place.name}
                </option>
              ))}
              {!lockedPlace && <option value="new">新建地点</option>}
            </select>
          </label>
          {selectedPlaceId === "new" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={newPlaceName}
                onChange={(event) => setNewPlaceName(event.target.value)}
                placeholder="地点名称"
                className="h-10 rounded-[8px] border border-border bg-surface px-3"
              />
              <input
                value={newCity}
                onChange={(event) => setNewCity(event.target.value)}
                placeholder="城市"
                className="h-10 rounded-[8px] border border-border bg-surface px-3"
              />
            </div>
          )}

          <label className="mt-3 block text-[13px] font-medium">
            视角
            <select
              value={selectedSceneId}
              disabled={lockedScene}
              onChange={(event) => setSelectedSceneId(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-[8px] border border-border bg-surface px-3 disabled:opacity-60"
            >
              <option value="">不加入视角时间轴</option>
              {availableScenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.title}
                </option>
              ))}
              {!lockedScene && <option value="new">新建视角</option>}
            </select>
          </label>
          {selectedSceneId === "new" && (
            <div className="mt-3 grid grid-cols-[1fr_120px] gap-2">
              <input
                value={newSceneTitle}
                onChange={(event) => setNewSceneTitle(event.target.value)}
                placeholder="视角名称"
                className="h-10 rounded-[8px] border border-border bg-surface px-3"
              />
              <input
                type="number"
                min={0}
                max={360}
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                placeholder="方向角"
                className="h-10 rounded-[8px] border border-border bg-surface px-3"
              />
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-border text-[13px]"
            >
              <Locate size={14} /> {locating ? "定位中…" : "使用当前位置"}
            </button>
            <button
              type="button"
              onClick={() => setShowMap((value) => !value)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-border text-[13px]"
            >
              <MapPin size={14} /> 地图选点
            </button>
          </div>
          {showMap && (
            <div className="mt-3 h-[300px] overflow-hidden rounded-[8px] border border-border">
              <LocationPickerMap value={coordinates} onChange={setCoordinates} />
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
          </p>
        </Section>

        <Section index="03" title="拍摄信息">
          <label className="block text-[13px] font-medium">
            拍摄时间
            <input
              type="datetime-local"
              value={capturedAt}
              onChange={(event) => setCapturedAt(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-[8px] border border-border bg-surface px-3"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              value={weather}
              onChange={(event) => setWeather(event.target.value)}
              placeholder="天气（可选）"
              className="h-10 rounded-[8px] border border-border bg-surface px-3"
            />
            <input
              type="number"
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              placeholder="温度 °C（可选）"
              className="h-10 rounded-[8px] border border-border bg-surface px-3"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["self", "public"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                aria-pressed={visibility === value}
                className={`h-10 rounded-[8px] border text-[12px] ${
                  visibility === value
                    ? "border-accent text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {{ self: "仅自己", public: "公开" }[value]}
              </button>
            ))}
          </div>
        </Section>

        {error && (
          <p role="alert" className="mx-4 mt-4 text-[12px] text-accent">
            {error}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur">
        <button
          onClick={submit}
          disabled={submitting || done}
          className="mx-auto flex h-11 w-full max-w-[588px] items-center justify-center gap-2 rounded-[8px] bg-accent text-sm text-accent-foreground disabled:opacity-60"
        >
          {done ? (
            <>
              <Check size={16} /> 已发布
            </>
          ) : submitting ? (
            "正在上传…"
          ) : (
            "发布这段记录"
          )}
        </button>
      </div>
    </div>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-6">
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-editorial text-[13px] text-accent">{index}</span>
        <h2 className="text-[14px] font-medium">{title}</h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}
