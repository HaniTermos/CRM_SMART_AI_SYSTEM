import React, { useState, useRef } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { InspectorPortal } from "./InspectorPortal";

export type DeviceBreakpoint = "desktop" | "tablet" | "mobile";

interface ResponsiveControlProps {
  label: string;
  activeDevice: DeviceBreakpoint;
  onSelectDevice?: (device: DeviceBreakpoint) => void;
  hasTabletOverride?: boolean;
  hasMobileOverride?: boolean;
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ResponsiveControlHeader({
  label,
  activeDevice,
  onSelectDevice,
  hasTabletOverride = false,
  hasMobileOverride = false,
  tooltip,
  className,
}: ResponsiveControlProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const getDeviceIcon = (dev: DeviceBreakpoint) => {
    switch (dev) {
      case "tablet":
        return <Tablet className="w-3 h-3 text-cyan-400" />;
      case "mobile":
        return <Smartphone className="w-3 h-3 text-emerald-400" />;
      case "desktop":
      default:
        return <Monitor className="w-3 h-3 text-slate-400" />;
    }
  };

  const cycleDevice = () => {
    if (!onSelectDevice) return;
    if (activeDevice === "desktop") onSelectDevice("tablet");
    else if (activeDevice === "tablet") onSelectDevice("mobile");
    else onSelectDevice("desktop");
  };

  return (
    <div className={cn("flex items-center justify-between text-xs py-0.5", className)}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-medium text-slate-300 truncate" title={tooltip || label}>
          {label}
        </span>
        <div className="relative inline-flex items-center" ref={triggerRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              cycleDevice();
            }}
            className={cn(
              "p-0.5 rounded transition hover:bg-slate-800 border border-transparent",
              activeDevice !== "desktop" && "border-indigo-500/50 bg-indigo-500/10",
              (hasTabletOverride || hasMobileOverride) && "relative"
            )}
            title={`Editing for ${activeDevice}. Click to choose breakpoint.`}
          >
            {getDeviceIcon(activeDevice)}
            {(hasTabletOverride || hasMobileOverride) && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 ring-1 ring-slate-900" />
            )}
          </button>

          <InspectorPortal open={open} anchorRef={triggerRef} onClose={() => setOpen(false)} width={220} align="left">
            <div className="bg-slate-900 border border-slate-700/80 rounded-md shadow-xl p-1 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  onSelectDevice?.("desktop");
                  setOpen(false);
                }}
                className={cn(
                  "p-1.5 rounded text-[10px] flex items-center gap-1.5 transition",
                  activeDevice === "desktop"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
                title="Desktop (All screens)"
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectDevice?.("tablet");
                  setOpen(false);
                }}
                className={cn(
                  "p-1.5 rounded text-[10px] flex items-center gap-1.5 transition relative",
                  activeDevice === "tablet"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
                title="Tablet override (≤ 1024px)"
              >
                <Tablet className="w-3 h-3" />
                <span>Tablet</span>
                {hasTabletOverride && <span className="w-1 h-1 rounded-full bg-cyan-400 ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectDevice?.("mobile");
                  setOpen(false);
                }}
                className={cn(
                  "p-1.5 rounded text-[10px] flex items-center gap-1.5 transition relative",
                  activeDevice === "mobile"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
                title="Mobile override (≤ 767px)"
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
                {hasMobileOverride && <span className="w-1 h-1 rounded-full bg-emerald-400 ml-auto" />}
              </button>
            </div>
          </InspectorPortal>
        </div>
      </div>
    </div>
  );
}
