import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

export function TableBanner() {
  const [tableInfo, setTableInfo] = useState<{ table: string; floor?: string } | null>(null);

  useEffect(() => {
    // 1. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");
    const floor = params.get("floor");

    if (table) {
      const data = { table, floor: floor || undefined };
      localStorage.setItem("smartstore_current_table", JSON.stringify(data));
      setTableInfo(data);
    } else {
      // 2. Check localStorage fallback
      const saved = localStorage.getItem("smartstore_current_table");
      if (saved) {
        try {
          setTableInfo(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem("smartstore_current_table");
        }
      }
    }
  }, []);

  if (!tableInfo) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#190E85] via-purple-900 to-indigo-900 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium border-b border-white/10">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          📍 You are ordering from <strong className="text-white font-bold underline decoration-emerald-400 underline-offset-2">Table {tableInfo.table}</strong>
          {tableInfo.floor ? ` (Floor ${tableInfo.floor})` : ""}
        </span>
      </div>
    </div>
  );
}

export function getActiveTableInfo() {
  const saved = localStorage.getItem("smartstore_current_table");
  if (!saved) return null;
  try {
    return JSON.parse(saved) as { table: string; floor?: string };
  } catch (e) {
    return null;
  }
}
