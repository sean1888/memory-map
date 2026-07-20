"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

const MAX_FILES = 6;
const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function ImageDropzone({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter((file) => TYPES.has(file.type) && file.size <= MAX_SIZE);
    if (valid.length !== incoming.length) {
      setError("仅支持 JPEG、PNG、WebP、AVIF，单张不超过 5MB");
    } else {
      setError(null);
    }
    onChange([...files, ...valid].slice(0, MAX_FILES));
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
        className={`grid min-h-32 w-full place-items-center rounded-[8px] border border-dashed px-4 text-center transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-border bg-surface"
        }`}
      >
        <span>
          <ImagePlus size={22} className="mx-auto text-accent" />
          <span className="mt-2 block text-[13px] font-medium">点击或拖拽图片到这里</span>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            最多 6 张，单张不超过 5MB
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-[11px] text-accent">{error}</p>}

      {previews.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {previews.map((url, index) => (
            <li
              key={url}
              className="group relative overflow-hidden rounded-[8px] border border-border"
            >
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                aria-label={`移除第 ${index + 1} 张图片`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
