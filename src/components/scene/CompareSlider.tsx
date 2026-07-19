import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

type Props = {
  leftSrc: string;
  rightSrc: string;
  leftLabel: string;
  rightLabel: string;
  aspect?: string; // css aspect-ratio value, default 3/2
  ariaLabel?: string;
};

export function CompareSlider({
  leftSrc,
  rightSrc,
  leftLabel,
  rightLabel,
  aspect = "3 / 2",
  ariaLabel = "拖动比较两张照片",
}: Props) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [updateFromClientX]);

  const startDrag = (e: React.PointerEvent) => {
    draggingRef.current = true;
    document.body.style.userSelect = "none";
    updateFromClientX(e.clientX);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 3));
    else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 3));
    else if (e.key === "Home") setPos(0);
    else if (e.key === "End") setPos(100);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-[8px] border border-border bg-muted select-none touch-none"
      style={{ aspectRatio: aspect }}
      onPointerDown={startDrag}
      role="group"
      aria-label={ariaLabel}
    >
      {/* Right image full */}
      <img
        src={rightSrc}
        alt={rightLabel}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Left image clipped via clip-path so it always matches the right image's frame */}
      <img
        src={leftSrc}
        alt={leftLabel}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Labels */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-[8px] bg-background/85 px-2 py-1 text-[11px] text-foreground shadow-sm">
        {leftLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-[8px] bg-background/85 px-2 py-1 text-[11px] text-foreground shadow-sm">
        {rightLabel}
      </span>

      {/* Divider + handle */}
      <div className="absolute inset-y-0" style={{ left: `calc(${pos}% - 1px)` }} aria-hidden>
        <div className="h-full w-[2px] bg-accent/90" />
      </div>
      <button
        type="button"
        role="slider"
        aria-label="比较位置"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          e.stopPropagation();
          startDrag(e);
        }}
        className="absolute top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ left: `${pos}%` }}
      >
        <GripVertical size={16} />
      </button>
    </div>
  );
}
