import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#71717a",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hexToHsv(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 200, s: 0.9, v: 0.9 };
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const initial = useMemo(() => hexToHsv(value), [value]);
  const [hue, setHue] = useState(initial.h);
  const [sat, setSat] = useState(initial.s);
  const [val, setVal] = useState(initial.v);
  const [text, setText] = useState(value);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const hueRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<"sv" | "hue" | null>(null);

  useEffect(() => {
    setText(value);
    const h = hexToHsv(value);
    setHue(h.h);
    setSat(h.s);
    setVal(h.v);
  }, [value]);

  const emit = useCallback(
    (h: number, s: number, v: number) => {
      const hex = hsvToHex(h, s, v);
      setText(hex);
      onChange(hex);
    },
    [onChange],
  );

  const onBoardPointer = useCallback(
    (clientX: number, clientY: number) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const s = x;
      const v = 1 - y;
      setSat(s);
      setVal(v);
      emit(hue, s, v);
    },
    [hue, emit],
  );

  const onHuePointer = useCallback(
    (clientX: number) => {
      const bar = hueRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const h = x * 360;
      setHue(h);
      emit(h, sat, val);
    },
    [sat, val, emit],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragRef.current === "sv") onBoardPointer(e.clientX, e.clientY);
      if (dragRef.current === "hue") onHuePointer(e.clientX);
    }
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onBoardPointer, onHuePointer]);

  const pureHue = hsvToHex(hue, 1, 1);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={boardRef}
        onPointerDown={(e) => {
          dragRef.current = "sv";
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          onBoardPointer(e.clientX, e.clientY);
        }}
        className="relative h-40 w-full rounded-lg overflow-hidden cursor-crosshair touch-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pureHue})`,
        }}
      >
        <div
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] pointer-events-none"
          style={{
            left: `${sat * 100}%`,
            top: `${(1 - val) * 100}%`,
            background: text,
          }}
        />
      </div>

      <div
        ref={hueRef}
        onPointerDown={(e) => {
          dragRef.current = "hue";
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          onHuePointer(e.clientX);
        }}
        className="relative h-4 w-full rounded-full cursor-pointer touch-none"
        style={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
      >
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] pointer-events-none"
          style={{ left: `${(hue / 360) * 100}%`, background: pureHue }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div
          className="size-8 rounded-md border shrink-0"
          style={{ background: text }}
          aria-label="Selected color"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setText(v);
            if (hexToRgb(v)) {
              const h = hexToHsv(v);
              setHue(h.h);
              setSat(h.s);
              setVal(h.v);
              onChange(v);
            }
          }}
          className="flex-1 h-9 rounded-md border bg-background px-3 text-sm uppercase tracking-wider font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          maxLength={7}
          spellCheck={false}
        />
        <input
          type="color"
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            const h = hexToHsv(v);
            setHue(h.h);
            setSat(h.s);
            setVal(h.v);
            onChange(v);
          }}
          className="size-9 rounded-md border bg-background cursor-pointer p-0.5"
          aria-label="System color picker"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => {
              setText(p);
              const h = hexToHsv(p);
              setHue(h.h);
              setSat(h.s);
              setVal(h.v);
              onChange(p);
            }}
            className={cn(
              "size-6 rounded-full border transition flex items-center justify-center",
              text.toLowerCase() === p.toLowerCase()
                ? "ring-2 ring-offset-2 ring-foreground/40 ring-offset-background"
                : "hover:scale-110",
            )}
            style={{ background: p }}
            aria-label={`Preset ${p}`}
          >
            {text.toLowerCase() === p.toLowerCase() && (
              <Check className="size-3 text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
