import React, { useState, useRef } from "react";
import { RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { InspectorPortal } from "./InspectorPortal";
import { DEFAULT_SYSTEM_THEME_TOKENS, resolveCssValue } from "../../theme/contract";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (newColor: string) => void;
  label?: string;
}

const PRESET_PALETTE = [
  "#000000",
  "#1e293b",
  "#475569",
  "#94a3b8",
  "#ffffff",
  "#6366f1",
  "#4f46e5",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function ColorPickerPopover({ color, onChange, label }: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [format] = useState<"HEXA" | "RGBA" | "HSLA">("HEXA");
  const triggerRef = useRef<HTMLDivElement>(null);

  const activeColor = color || "#ffffff";
  const resolved = resolveCssValue(color, DEFAULT_SYSTEM_THEME_TOKENS);
  const displayLabel = color
    ? resolved.source === "theme"
      ? `${resolved.display} · Site Styles`
      : resolved.display.length > 14
      ? resolved.display.slice(0, 14) + "…"
      : resolved.display
    : "Default";

  return (
    <div className="inline-flex items-center gap-1.5" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2 px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
        title="Open Color Picker"
      >
        <span
          className="w-4 h-4 rounded-full border border-slate-700 shadow-inner block shrink-0 relative overflow-hidden"
          style={{ backgroundColor: activeColor }}
        />
        <span className="text-[11px] font-mono text-slate-300 group-hover:text-white uppercase">
          {displayLabel}
        </span>
      </button>

      <InspectorPortal open={open} anchorRef={triggerRef} onClose={() => setOpen(false)} width={256}>
        <div className="bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-3 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-200">{label || "Color Picker"}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="Clear Color / Reset"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeColor.startsWith("#") && activeColor.length === 7 ? activeColor : "#6366f1"}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#ffffff or rgba(...)"
                className="flex-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
              />
              <span className="text-[10px] font-bold text-slate-400 px-1.5 py-1 bg-slate-950 rounded border border-slate-800">
                {format}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-medium text-slate-400">Presets</span>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onChange(hex)}
                  className={cn(
                    "w-6 h-6 rounded-md border border-slate-700 hover:scale-110 transition shadow-xs",
                    color.toLowerCase() === hex.toLowerCase() && "ring-2 ring-indigo-500"
                  )}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>
        </div>
      </InspectorPortal>
    </div>
  );
}
