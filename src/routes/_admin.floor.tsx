import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Plus, Trash2, RotateCcw, Users } from "lucide-react";
import { getStorage, setStorage } from "@/lib/ssr-safe";

export const Route = createFileRoute("/_admin/floor")({
    component: FloorRoute,
});

type TableStatus = "free" | "reserved" | "occupied";

interface Table {
    id: string;
    name: string;
    x: number;
    y: number;
    seats: number;
    status: TableStatus;
    shape: "round" | "square" | "rect";
}

const defaultTables: Table[] = [
    { id: "t1", name: "T1", x: 10, y: 10, seats: 2, status: "free", shape: "round" },
    { id: "t2", name: "T2", x: 25, y: 10, seats: 4, status: "occupied", shape: "round" },
    { id: "t3", name: "T3", x: 40, y: 10, seats: 6, status: "reserved", shape: "rect" },
    { id: "t4", name: "T4", x: 10, y: 35, seats: 2, status: "free", shape: "square" },
    { id: "t5", name: "T5", x: 30, y: 35, seats: 4, status: "free", shape: "round" },
    { id: "t6", name: "T6", x: 50, y: 35, seats: 8, status: "occupied", shape: "rect" },
];

const STATUS_COLORS: Record<TableStatus, string> = {
    free: "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
    reserved: "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400",
    occupied: "bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400",
};

function FloorRoute() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        setTables(getStorage("ss_floor_tables", defaultTables));
        setLoaded(true);
    }, []);

    const save = (t: Table[]) => {
        setStorage("ss_floor_tables", t);
        setTables(t);
    };

    const cycleStatus = (id: string) => {
        const next: Record<TableStatus, TableStatus> = {
            free: "reserved",
            reserved: "occupied",
            occupied: "free",
        };
        const t = tables.find((x) => x.id === id);
        if (t) save(tables.map((x) => (x.id === id ? { ...x, status: next[x.status] } : x)));
    };

    const addTable = () => {
        const newTable: Table = {
            id: Math.random().toString(36).slice(2, 6),
            name: `T${tables.length + 1}`,
            x: 20,
            y: 20,
            seats: 4,
            status: "free",
            shape: "round",
        };
        save([...tables, newTable]);
    };

    const deleteTable = (id: string) => save(tables.filter((t) => t.id !== id));

    if (!loaded) return <div className="h-96 flex items-center justify-center text-adaptive-muted">Loading floor plan...</div>;

    return (
        <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-adaptive">Floor Plan</h1>
                    <p className="text-sm text-adaptive-muted">Drag tables to arrange. Tap to change status.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => save(defaultTables)}
                        className="px-3 py-2 rounded-xl glass-adaptive text-adaptive text-sm hover:shadow-md transition-shadow"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={addTable}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" /> Add Table
                    </button>
                </div>
            </div>

            <div className="flex gap-4 text-xs text-adaptive-muted">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Occupied
                </span>
            </div>

            <div className="flex-1 rounded-3xl glass-adaptive relative overflow-hidden border-2 border-dashed border-adaptive">
                {tables.map((table) => {
                    const isSelected = selected === table.id;
                    const shapeClass =
                        table.shape === "round"
                            ? "rounded-full w-16 h-16"
                            : table.shape === "square"
                                ? "rounded-xl w-16 h-16"
                                : "rounded-xl w-20 h-14";

                    return (
                        <motion.div
                            key={table.id}
                            drag
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                                const newX = Math.max(0, Math.min(90, table.x + info.offset.x / 8));
                                const newY = Math.max(0, Math.min(80, table.y + info.offset.y / 8));
                                save(tables.map((t) => (t.id === table.id ? { ...t, x: newX, y: newY } : t)));
                            }}
                            onClick={() => {
                                setSelected(table.id);
                                cycleStatus(table.id);
                            }}
                            style={{ left: `${table.x}%`, top: `${table.y}%`, position: "absolute" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`absolute cursor-pointer flex flex-col items-center justify-center border-2 ${shapeClass} ${STATUS_COLORS[table.status]} ${isSelected ? "ring-2 ring-[#00E0FF] ring-offset-2" : ""}`}
                        >
                            <span className="text-xs font-bold">{table.name}</span>
                            <span className="text-[10px] flex items-center gap-0.5">
                                <Users className="h-2.5 w-2.5" />
                                {table.seats}
                            </span>
                            {isSelected && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTable(table.id);
                                    }}
                                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg"
                                >
                                    <Trash2 className="h-2.5 w-2.5" />
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}