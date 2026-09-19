import React, { useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CornerValues,
  CssUnit,
  formatCssLength,
  parseCssLength,
  readBorderRadiusFromStyles,
  writeBorderRadiusPatch,
} from "../../types/css-values";

const UNITS: CssUnit[] = ["px", "%", "rem", "em", "vw", "vh"];

interface BorderRadiusEditorProps {
  styles: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function BorderRadiusEditor({ styles, onChange }: BorderRadiusEditorProps) {
  const initial = readBorderRadiusFromStyles(styles);
  const [linked, setLinked] = useState(initial.linked);
  const [unit, setUnit] = useState<CssUnit>(() => parseCssLength(initial.topLeft).unit);

  const corners = readBorderRadiusFromStyles(styles);

  const cornerNums = {
    topLeft: parseCssLength(corners.topLeft).value,
    topRight: parseCssLength(corners.topRight).value,
    bottomRight: parseCssLength(corners.bottomRight).value,
    bottomLeft: parseCssLength(corners.bottomLeft).value,
  };

  const applyCorners = (next: CornerValues) => {
    onChange(writeBorderRadiusPatch(next));
  };

  const handleCornerChange = (field: keyof typeof cornerNums, raw: string) => {
    const formatted = raw === "" ? "" : formatCssLength(raw, unit);
    if (linked) {
      applyCorners({
        topLeft: formatted,
        topRight: formatted,
        bottomRight: formatted,
        bottomLeft: formatted,
        linked: true,
      });
      return;
    }
    applyCorners({
      ...corners,
      [field]: formatted,
      linked: false,
    });
  };

  const handleUnitChange = (newUnit: CssUnit) => {
    setUnit(newUnit);
    const convert = (val: string) => {
      const num = parseCssLength(val).value;
      return num ? formatCssLength(num, newUnit) : "";
    };
    applyCorners({
      topLeft: convert(corners.topLeft),
      topRight: convert(corners.topRight),
      bottomRight: convert(corners.bottomRight),
      bottomLeft: convert(corners.bottomLeft),
      linked,
    });
  };

  return (
    <div className="space-y-2 border-t border-slate-800/60 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-300">Border Radius</span>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => handleUnitChange(u)}
                className={cn(
                  "px-1 py-0.5 rounded text-[9px] font-mono transition",
                  unit === u ? "bg-slate-800 text-indigo-300 font-bold" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {u}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLinked(!linked)}
            className={cn(
              "p-1 rounded border transition",
              linked
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40"
                : "bg-slate-950 text-slate-500 border-slate-800"
            )}
            title={linked ? "Corners linked" : "Corners independent"}
          >
            {linked ? <Link2 className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {(
          [
            ["topLeft", "TL"],
            ["topRight", "TR"],
            ["bottomRight", "BR"],
            ["bottomLeft", "BL"],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="flex flex-col items-center gap-0.5">
            <input
              type="number"
              min={0}
              value={cornerNums[field]}
              onChange={(e) => handleCornerChange(field, e.target.value)}
              placeholder="0"
              className="w-full text-center px-1 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[9px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
