import React from "react";
import { cn } from "@/lib/utils";
import { ColorPickerPopover } from "./ColorPickerPopover";
import {
  BoxShadowState,
  SHADOW_PRESETS,
  boxShadowToCss,
  readBoxShadowFromCss,
} from "../../types/css-values";

interface BoxShadowEditorProps {
  value: string;
  onChange: (css: string) => void;
}

const PRESET_LABELS: Record<string, string> = {
  none: "None",
  subtle: "Subtle",
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "Extra Large",
  floating: "Floating",
  glow: "Glow",
  custom: "Custom",
};

export function BoxShadowEditor({ value, onChange }: BoxShadowEditorProps) {
  const state = readBoxShadowFromCss(value);

  const update = (patch: Partial<BoxShadowState>) => {
    const next = { ...state, ...patch };
    onChange(boxShadowToCss(next));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="text-[10px] text-slate-400 font-medium">Preset</span>
        <select
          value={state.preset}
          onChange={(e) => {
            const preset = e.target.value;
            if (preset === "custom") {
              update({ preset: "custom" });
            } else {
              onChange(SHADOW_PRESETS[preset] || "none");
            }
          }}
          className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs"
        >
          {Object.keys(PRESET_LABELS).map((key) => (
            <option key={key} value={key}>
              {PRESET_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {state.preset === "custom" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "blur", "spread"] as const).map((field) => (
              <div key={field} className="space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase">{field}</span>
                <input
                  type="number"
                  value={state[field]}
                  onChange={(e) => update({ [field]: e.target.value })}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">Shadow Color</span>
            <ColorPickerPopover color={state.color} onChange={(c) => update({ color: c })} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Opacity</span>
              <span className="text-[10px] font-mono text-slate-400">{Math.round(state.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(state.opacity * 100)}
              onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
              className="w-full accent-indigo-500"
            />
          </div>

          <label className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Inset shadow</span>
            <input
              type="checkbox"
              checked={state.inset}
              onChange={(e) => update({ inset: e.target.checked })}
              className="rounded border-slate-700 accent-indigo-600"
            />
          </label>
        </>
      )}

      <div
        className="h-12 rounded-lg border border-slate-700 bg-slate-800/50"
        style={{ boxShadow: value === "none" ? undefined : value }}
      />
    </div>
  );
}
