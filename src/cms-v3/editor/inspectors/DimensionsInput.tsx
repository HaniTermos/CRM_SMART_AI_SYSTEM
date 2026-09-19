import React, { useState, useEffect } from "react";
import { Link2, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveControlHeader, DeviceBreakpoint } from "./ResponsiveControl";

interface DimensionsInputProps {
  label: string;
  activeDevice: DeviceBreakpoint;
  onSelectDevice?: (device: DeviceBreakpoint) => void;
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  onChange: (values: { top: string; right: string; bottom: string; left: string }) => void;
  hasTabletOverride?: boolean;
  hasMobileOverride?: boolean;
}

const UNITS = ["px", "%", "em", "rem", "vw"];

export function DimensionsInput({
  label,
  activeDevice,
  onSelectDevice,
  top = "",
  right = "",
  bottom = "",
  left = "",
  onChange,
  hasTabletOverride,
  hasMobileOverride,
}: DimensionsInputProps) {
  const [isLinked, setIsLinked] = useState(true);
  const [unit, setUnit] = useState<string>("px");

  // Extract raw numerical values from strings like "20px" or "5%"
  const parseVal = (val: string | number) => {
    if (val === undefined || val === null) return "";
    const str = String(val).trim();
    const num = parseFloat(str);
    return isNaN(num) ? "" : String(num);
  };

  const topNum = parseVal(top);
  const rightNum = parseVal(right);
  const bottomNum = parseVal(bottom);
  const leftNum = parseVal(left);

  const handleInputChange = (field: "top" | "right" | "bottom" | "left", rawValue: string) => {
    const formatted = rawValue === "" ? "" : `${rawValue}${unit}`;

    if (isLinked) {
      onChange({
        top: formatted,
        right: formatted,
        bottom: formatted,
        left: formatted,
      });
    } else {
      onChange({
        top: field === "top" ? formatted : top ? String(top) : "",
        right: field === "right" ? formatted : right ? String(right) : "",
        bottom: field === "bottom" ? formatted : bottom ? String(bottom) : "",
        left: field === "left" ? formatted : left ? String(left) : "",
      });
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    // Convert existing non-empty values
    if (topNum || rightNum || bottomNum || leftNum) {
      onChange({
        top: topNum ? `${topNum}${newUnit}` : "",
        right: rightNum ? `${rightNum}${newUnit}` : "",
        bottom: bottomNum ? `${bottomNum}${newUnit}` : "",
        left: leftNum ? `${leftNum}${newUnit}` : "",
      });
    }
  };

  return (
    <div className="space-y-1.5 py-1">
      {/* Label with Responsive Device Indicator & Unit Picker */}
      <div className="flex items-center justify-between">
        <ResponsiveControlHeader
          label={label}
          activeDevice={activeDevice}
          onSelectDevice={onSelectDevice}
          hasTabletOverride={hasTabletOverride}
          hasMobileOverride={hasMobileOverride}
        />

        {/* Unit Selector */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              className={cn(
                "px-1 py-0.5 rounded text-[9px] font-mono transition",
                unit === u
                  ? "bg-slate-800 text-indigo-300 font-bold"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Inputs Grid + Link Button */}
      <div className="flex items-center gap-1.5">
        <div className="grid grid-cols-4 gap-1 flex-1">
          {/* Top */}
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={topNum}
              onChange={(e) => handleInputChange("top", e.target.value)}
              placeholder="0"
              className="w-full text-center px-1 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[9px] text-slate-500 mt-0.5">Top</span>
          </div>

          {/* Right */}
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={rightNum}
              onChange={(e) => handleInputChange("right", e.target.value)}
              placeholder="0"
              className="w-full text-center px-1 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[9px] text-slate-500 mt-0.5">Right</span>
          </div>

          {/* Bottom */}
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={bottomNum}
              onChange={(e) => handleInputChange("bottom", e.target.value)}
              placeholder="0"
              className="w-full text-center px-1 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[9px] text-slate-500 mt-0.5">Bottom</span>
          </div>

          {/* Left */}
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={leftNum}
              onChange={(e) => handleInputChange("left", e.target.value)}
              placeholder="0"
              className="w-full text-center px-1 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[9px] text-slate-500 mt-0.5">Left</span>
          </div>
        </div>

        {/* Link / Unlink Button */}
        <button
          type="button"
          onClick={() => setIsLinked(!isLinked)}
          className={cn(
            "p-1.5 rounded transition border shrink-0 mb-3",
            isLinked
              ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40"
              : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
          )}
          title={isLinked ? "Values are linked together" : "Values are unlinked"}
        >
          {isLinked ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
