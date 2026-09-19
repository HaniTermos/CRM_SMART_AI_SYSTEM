import React, { useState, useRef } from "react";
import { Edit3, Globe, RotateCcw, X, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveControlHeader, DeviceBreakpoint } from "./ResponsiveControl";
import { InspectorPortal } from "./InspectorPortal";

interface TypographyPopoverProps {
  activeDevice: DeviceBreakpoint;
  onSelectDevice?: (dev: DeviceBreakpoint) => void;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  fontStyle?: string;
  textDecoration?: string;
  onChange: (patch: Record<string, unknown>) => void;
}

const GOOGLE_FONTS = [
  "Inter",
  "Outfit",
  "Plus Jakarta Sans",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Cinzel",
  "Space Grotesk",
  "Cabinet Grotesk",
  "Satoshi",
  "Manrope",
  "DM Sans",
  "Syne",
  "Clash Display",
  "Fraunces",
  "Cormorant Garamond",
  "JetBrains Mono",
  "system-ui",
];

const FONT_WEIGHTS = [
  { label: "100 - Thin", val: 100 },
  { label: "200 - Extra Light", val: 200 },
  { label: "300 - Light", val: 300 },
  { label: "400 - Normal", val: 400 },
  { label: "500 - Medium", val: 500 },
  { label: "600 - Semi Bold", val: 600 },
  { label: "700 - Bold", val: 700 },
  { label: "800 - Extra Bold", val: 800 },
  { label: "900 - Black", val: 900 },
];

export function TypographyPopover({
  activeDevice,
  onSelectDevice,
  fontFamily = "",
  fontSize = "",
  fontWeight = 400,
  lineHeight = "",
  letterSpacing = "",
  textTransform = "none",
  onChange,
}: TypographyPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const rawSize = fontSize ? String(fontSize).replace(/[^0-9.]/g, "") : "";

  return (
    <div className="flex items-center justify-between py-1" ref={triggerRef}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-300">Typography</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Global Font Tokens"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "p-1.5 rounded transition border",
            open
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
          )}
          title="Edit Typography"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      </div>

      <InspectorPortal open={open} anchorRef={triggerRef} onClose={() => setOpen(false)} width={288}>
        <div className="bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-3.5 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" /> Typography
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    fontFamily: "",
                    fontSize: "",
                    fontWeight: 400,
                    lineHeight: "",
                    letterSpacing: "",
                    textTransform: "none",
                  })
                }
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                title="Reset Typography"
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

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium">Family</span>
            <select
              value={fontFamily}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Default (System / Theme)</option>
              {GOOGLE_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <ResponsiveControlHeader
              label="Size"
              activeDevice={activeDevice}
              onSelectDevice={onSelectDevice}
            />
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="96"
                value={rawSize || 16}
                onChange={(e) => onChange({ fontSize: `${e.target.value}px` })}
                className="flex-1 accent-indigo-500"
              />
              <div className="flex items-center bg-slate-950 px-2 py-1 rounded border border-slate-800 w-16 justify-between font-mono text-[11px]">
                <input
                  type="number"
                  value={rawSize}
                  onChange={(e) => onChange({ fontSize: e.target.value ? `${e.target.value}px` : "" })}
                  placeholder="16"
                  className="w-8 bg-transparent text-slate-200 focus:outline-none"
                />
                <span className="text-slate-500 text-[10px]">PX</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium">Weight</span>
            <select
              value={String(fontWeight)}
              onChange={(e) => onChange({ fontWeight: Number(e.target.value) || e.target.value })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
            >
              {FONT_WEIGHTS.map((w) => (
                <option key={w.val} value={w.val}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium">Transform</span>
            <select
              value={textTransform}
              onChange={(e) => onChange({ textTransform: e.target.value })}
              className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
            >
              <option value="none">Default</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium">Line-Height</span>
            <input
              type="text"
              value={lineHeight}
              onChange={(e) => onChange({ lineHeight: e.target.value })}
              placeholder="e.g. 1.5 or 24px"
              className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-medium">Letter Spacing</span>
            <input
              type="text"
              value={letterSpacing}
              onChange={(e) => onChange({ letterSpacing: e.target.value })}
              placeholder="e.g. 0.05em or 1px"
              className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
            />
          </div>
        </div>
      </InspectorPortal>
    </div>
  );
}
