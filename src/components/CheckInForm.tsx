"use client";

import { useState } from "react";
import { X, MapPin, Pencil } from "lucide-react";

type Props = {
  latitude: number;
  longitude: number;
  placeId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CheckInForm({ latitude, longitude, placeId, onClose, onSuccess }: Props) {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("请写点什么");
      return;
    }
    if (!author.trim()) {
      setError("请留下你的名字");
      return;
    }
    if (!placeId && (!placeName.trim() || !city.trim())) {
      setError("请填写新地点名称和城市");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());
    formData.append("clientRequestId", crypto.randomUUID());
    formData.append("placeId", placeId || "new");
    if (!placeId) {
      formData.append("placeName", placeName.trim());
      formData.append("city", city.trim());
    }
    formData.append("author", author.trim());
    formData.append("content", content.trim());

    try {
      const response = await fetch("/api/memories", { method: "POST", body: formData });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (response.ok && result.success) {
        onSuccess();
      } else {
        setError(result.error || "提交失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4 animate-fade-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] rounded-[12px] bg-background p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-editorial text-[20px]">记录这一刻</h2>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin size={11} className="text-accent" />
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground hover:text-foreground"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-[8px] border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] text-accent">
            {error}
          </div>
        )}

        {/* 署名 */}
        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-medium">
            <Pencil size={12} className="mr-1 inline" />
            你的名字
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent"
            placeholder="留下署名"
            maxLength={20}
          />
        </div>

        {!placeId && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[13px] font-medium">
              地点名称
              <input
                value={placeName}
                onChange={(event) => setPlaceName(event.target.value)}
                className="mt-1.5 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent"
                maxLength={80}
              />
            </label>
            <label className="text-[13px] font-medium">
              城市
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="mt-1.5 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent"
                maxLength={80}
              />
            </label>
          </div>
        )}

        {/* 内容 */}
        <div className="mt-3">
          <label className="mb-1.5 block text-[13px] font-medium">一段文字</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-[8px] border border-border bg-surface p-3 text-[14px] leading-6 outline-none focus:border-accent"
            placeholder="写下你当时看到、听到、想到的。"
          />
        </div>

        {/* 提交 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-accent text-accent-foreground text-sm disabled:opacity-60"
        >
          {submitting ? "提交中…" : "发布这段记录"}
        </button>
      </div>
    </div>
  );
}
