import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Save,
    Trash2,
    Grid3X3,
    Layers,
    Square,
    Circle,
    RectangleHorizontal,
    Armchair,
    Wine,
    Minus,
    ChevronDown,
    RotateCcw,
    Eye,
    EyeOff,
    Hash,
    Maximize2,
    X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/floor")({
    component: FloorEditorRoute,
});

/* ─────────────── Types ─────────────── */
type ElementType =
    | "table_square_2"
    | "table_square_4"
    | "table_round_4"
    | "table_round_6"
    | "table_rectangle_6"
    | "table_rectangle_8"
    | "chair"
    | "bar"
    | "wall";

interface EditorElement {
    clientId: string;
    id?: number;
    type: ElementType;
    pos_x: number;
    pos_y: number;
    rotation: number;
    label: string;
    capacity: number;
    color_tag: string;
    is_active: boolean;
}

interface FloorLayout {
    id: number;
    floor_id: number;
    name: string;
    is_default: boolean;
    elements?: Array<{
        id: number;
        type: string;
        pos_x: number;
        pos_y: number;
        rotation: number;
        label: string;
        capacity: number;
        color_tag: string;
        is_active: boolean;
    }>;
}

interface Floor {
    id: number;
    store_id: number;
    name: string;
    order_index: number;
    is_active: boolean;
}

/* ─────────────── Config ─────────────── */
const PALETTE: {
    type: ElementType;
    label: string;
    icon: React.ReactNode;
    defaultCapacity: number;
    w: number;
    h: number;
}[] = [
        { type: "table_square_2", label: "2-Seater", icon: <Square className="h-4 w-4" />, defaultCapacity: 2, w: 60, h: 60 },
        { type: "table_square_4", label: "4-Seater", icon: <Square className="h-5 w-5" />, defaultCapacity: 4, w: 80, h: 80 },
        { type: "table_round_4", label: "Round 4", icon: <Circle className="h-5 w-5" />, defaultCapacity: 4, w: 80, h: 80 },
        { type: "table_round_6", label: "Round 6", icon: <Circle className="h-6 w-6" />, defaultCapacity: 6, w: 100, h: 100 },
        { type: "table_rectangle_6", label: "Rect 6", icon: <RectangleHorizontal className="h-5 w-6" />, defaultCapacity: 6, w: 140, h: 80 },
        { type: "table_rectangle_8", label: "Rect 8", icon: <RectangleHorizontal className="h-5 w-7" />, defaultCapacity: 8, w: 160, h: 90 },
        { type: "chair", label: "Chair", icon: <Armchair className="h-4 w-4" />, defaultCapacity: 1, w: 32, h: 32 },
        { type: "bar", label: "Bar", icon: <Wine className="h-4 w-4" />, defaultCapacity: 4, w: 120, h: 40 },
        { type: "wall", label: "Wall", icon: <Minus className="h-4 w-4" />, defaultCapacity: 0, w: 120, h: 8 },
    ];

const COLOR_TAGS = [
    { name: "Default", value: "default", bg: "bg-slate-500" },
    { name: "VIP", value: "vip", bg: "bg-amber-500" },
    { name: "Smoking", value: "smoking", bg: "bg-red-500" },
    { name: "Terrace", value: "terrace", bg: "bg-emerald-500" },
    { name: "Bar", value: "bar", bg: "bg-purple-500" },
];

let idCounter = 0;
const genId = () => `el-${++idCounter}-${Date.now()}`;

const getStoreId = () => 1;

/* ─────────────── Hooks (inlined) ─────────────── */
function useFloors() {
    const storeId = getStoreId();
    return useQuery({
        queryKey: ["floors", storeId],
        queryFn: async () => {
            const res = await api.get(`/floors/${storeId}`);
            return res.data.data as Floor[];
        },
    });
}

function useFloor(floorId: number | null) {
    const storeId = getStoreId();
    return useQuery({
        queryKey: ["floor", storeId, floorId],
        queryFn: async () => {
            if (!floorId) return null;
            const res = await api.get(`/floors/${storeId}/${floorId}`);
            return res.data.data as { floor: Floor; layouts: FloorLayout[] };
        },
        enabled: !!floorId,
    });
}

function useSaveLayout() {
    const queryClient = useQueryClient();
    const storeId = getStoreId();

    return useMutation({
        mutationFn: async ({
            floorId,
            layoutId,
            elements,
        }: {
            floorId: number;
            layoutId: number;
            elements: Array<{
                type: string;
                pos_x: number;
                pos_y: number;
                rotation: number;
                label: string;
                capacity: number;
                color_tag: string;
                is_active: boolean;
            }>;
        }) => {
            const res = await api.post(
                `/floors/${storeId}/${floorId}/layouts/${layoutId}/save`,
                { elements }
            );
            return res.data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({
                queryKey: ["floor", storeId, vars.floorId],
            });
        },
    });
}

function useCreateFloor() {
    const queryClient = useQueryClient();
    const storeId = getStoreId();

    return useMutation({
        mutationFn: async (name: string) => {
            const res = await api.post(`/floors/${storeId}`, {
                name,
                order_index: 0,
            });
            return res.data.data as Floor;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["floors", storeId] });
        },
    });
}

/* ─────────────── Component ─────────────── */
function FloorEditorRoute() {
    const { data: floors, isLoading: floorsLoading } = useFloors();
    const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
    const [activeLayoutId, setActiveLayoutId] = useState<number | null>(null);
    const [elements, setElements] = useState<EditorElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [autoNumber, setAutoNumber] = useState(true);
    const [floorDropdownOpen, setFloorDropdownOpen] = useState(false);
    const [newFloorName, setNewFloorName] = useState("");
    const [showNewFloor, setShowNewFloor] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const { data: floorData } = useFloor(activeFloorId);
    const saveLayout = useSaveLayout();
    const createFloor = useCreateFloor();

    useEffect(() => {
        if (floorData?.layouts?.length) {
            const defaultLayout = floorData.layouts.find((l) => l.is_default) || floorData.layouts[0];
            setActiveLayoutId(defaultLayout.id);
            if (defaultLayout.elements) {
                setElements(
                    defaultLayout.elements.map((e) => ({
                        clientId: genId(),
                        id: e.id,
                        type: e.type as ElementType,
                        pos_x: e.pos_x,
                        pos_y: e.pos_y,
                        rotation: e.rotation,
                        label: e.label,
                        capacity: e.capacity,
                        color_tag: e.color_tag,
                        is_active: e.is_active,
                    }))
                );
            } else {
                setElements([]);
            }
        }
    }, [floorData]);

    useEffect(() => {
        if (floors?.length && !activeFloorId) {
            setActiveFloorId(floors[0].id);
        }
    }, [floors, activeFloorId]);

    const selectedEl = elements.find((e) => e.clientId === selectedId) || null;

    const snap = (val: number) => (snapToGrid ? Math.round(val / 20) * 20 : val);

    const addElement = (type: ElementType) => {
        const config = PALETTE.find((p) => p.type === type)!;
        const count = elements.filter((e) => e.type.startsWith("table")).length + 1;
        const newEl: EditorElement = {
            clientId: genId(),
            type,
            pos_x: snap(100 + Math.random() * 40),
            pos_y: snap(100 + Math.random() * 40),
            rotation: 0,
            label: type.startsWith("table") && autoNumber ? `T${count}` : "",
            capacity: config.defaultCapacity,
            color_tag: "default",
            is_active: true,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.clientId);
    };

    const updateElement = (clientId: string, patch: Partial<EditorElement>) => {
        setElements((prev) => prev.map((e) => (e.clientId === clientId ? { ...e, ...patch } : e)));
    };

    const deleteElement = (clientId: string) => {
        setElements((prev) => prev.filter((e) => e.clientId !== clientId));
        if (selectedId === clientId) setSelectedId(null);
    };

    const handleDragEnd = (clientId: string, info: any) => {
        const el = elements.find((e) => e.clientId === clientId);
        if (!el || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const newX = snap(el.pos_x + info.offset.x);
        const newY = snap(el.pos_y + info.offset.y);

        const maxX = rect.width - 60;
        const maxY = rect.height - 60;

        updateElement(clientId, {
            pos_x: Math.max(0, Math.min(newX, maxX)),
            pos_y: Math.max(0, Math.min(newY, maxY)),
        });
    };

    const handleSave = async () => {
        if (!activeFloorId || !activeLayoutId) return;
        const payload = elements.map(({ clientId, ...rest }) => ({
            type: rest.type,
            pos_x: rest.pos_x,
            pos_y: rest.pos_y,
            rotation: rest.rotation,
            label: rest.label,
            capacity: rest.capacity,
            color_tag: rest.color_tag,
            is_active: rest.is_active,
        }));
        try {
            await saveLayout.mutateAsync({
                floorId: activeFloorId,
                layoutId: activeLayoutId,
                elements: payload,
            });
            toast.success("Layout saved");
        } catch (err) {
            toast.error("Failed to save layout");
        }
    };

    const handleCreateFloor = async () => {
        if (!newFloorName.trim()) return;
        try {
            await createFloor.mutateAsync(newFloorName.trim());
            setNewFloorName("");
            setShowNewFloor(false);
            toast.success("Floor created");
        } catch (err) {
            toast.error("Failed to create floor");
        }
    };

    const totalSeats = elements
        .filter((e) => e.type.startsWith("table") && e.is_active)
        .reduce((sum, e) => sum + e.capacity, 0);

    const activeTables = elements.filter((e) => e.type.startsWith("table") && e.is_active).length;

    if (floorsLoading) {
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Loading floors...
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col -mx-4 -my-6 px-4 py-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center text-white">
                        <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-adaptive">Floor Plan</h1>
                        <p className="text-xs text-adaptive-muted">
                            {activeTables} tables · {totalSeats} seats
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setFloorDropdownOpen(!floorDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-adaptive text-sm font-medium text-adaptive"
                        >
                            {floors?.find((f) => f.id === activeFloorId)?.name || "Select Floor"}
                            <ChevronDown className="h-3.5 w-3.5 text-adaptive-muted" />
                        </button>
                        <AnimatePresence>
                            {floorDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute left-0 mt-2 w-48 rounded-xl glass-adaptive-strong border border-white/20 shadow-2xl py-1 z-50"
                                >
                                    {floors?.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => {
                                                setActiveFloorId(f.id);
                                                setFloorDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${f.id === activeFloorId ? "text-[#190E85] dark:text-[#00E0FF] font-semibold" : "text-adaptive"
                                                }`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                    <div className="border-t border-adaptive mt-1 pt-1 px-2">
                                        {!showNewFloor ? (
                                            <button
                                                onClick={() => setShowNewFloor(true)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-adaptive-muted hover:text-adaptive transition-colors"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add Floor
                                            </button>
                                        ) : (
                                            <div className="flex gap-1">
                                                <input
                                                    value={newFloorName}
                                                    onChange={(e) => setNewFloorName(e.target.value)}
                                                    placeholder="Floor name"
                                                    className="flex-1 rounded-lg px-2 py-1 text-xs glass-input outline-none"
                                                    onKeyDown={(e) => e.key === "Enter" && handleCreateFloor()}
                                                    autoFocus
                                                />
                                                <button onClick={handleCreateFloor} className="p-1 rounded-lg bg-[#190E85] text-white">
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${editMode ? "bg-[#190E85] text-white" : "glass-adaptive text-adaptive-muted"
                            }`}
                    >
                        {editMode ? "Edit" : "View"}
                    </button>
                    <button
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={`p-2 rounded-xl transition-colors ${snapToGrid ? "bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF]" : "glass-adaptive text-adaptive-muted"
                            }`}
                        title="Snap to grid"
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveLayout.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saveLayout.isPending ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Palette */}
                {editMode && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-16 lg:w-20 shrink-0 rounded-2xl glass-adaptive p-2 flex flex-col gap-2 overflow-y-auto"
                    >
                        <p className="text-[9px] font-bold uppercase tracking-wider text-adaptive-muted text-center mb-1">
                            Tables
                        </p>
                        {PALETTE.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => addElement(item.type)}
                                className="flex flex-col items-center gap-1 p-2 rounded-xl hover-adaptive transition-colors group"
                                title={item.label}
                            >
                                <div className="text-adaptive-muted group-hover:text-[#190E85] dark:group-hover:text-[#00E0FF] transition-colors">
                                    {item.icon}
                                </div>
                                <span className="text-[9px] text-adaptive-muted group-hover:text-adaptive transition-colors hidden lg:block">
                                    {item.label}
                                </span>
                            </button>
                        ))}

                        <div className="border-t border-adaptive my-1" />
                        <button
                            onClick={() => setAutoNumber(!autoNumber)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${autoNumber ? "bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF]" : "hover-adaptive text-adaptive-muted"
                                }`}
                            title="Auto-number tables"
                        >
                            <Hash className="h-4 w-4" />
                            <span className="text-[9px] hidden lg:block">Auto #</span>
                        </button>
                    </motion.div>
                )}

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="flex-1 rounded-2xl border-2 border-dashed border-gray-300/50 dark:border-white/10 relative overflow-hidden bg-white/30 dark:bg-white/5"
                    style={{
                        backgroundImage: snapToGrid
                            ? "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)"
                            : "none",
                        backgroundSize: "20px 20px",
                    }}
                    onClick={() => setSelectedId(null)}
                >
                    <AnimatePresence>
                        {elements.map((el) => {
                            const config = PALETTE.find((p) => p.type === el.type)!;
                            const isSelected = selectedId === el.clientId;

                            return (
                                <motion.div
                                    key={el.clientId}
                                    drag={editMode}
                                    dragMomentum={false}
                                    onDragEnd={(_, info) => handleDragEnd(el.clientId, info)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(el.clientId);
                                    }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: el.is_active ? 1 : 0.4,
                                        scale: 1,
                                        x: el.pos_x,
                                        y: el.pos_y,
                                        rotate: el.rotation,
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className={`absolute cursor-pointer select-none group ${isSelected ? "z-30" : "z-10"
                                        }`}
                                    style={{ width: config.w, height: config.h }}
                                >
                                    <div
                                        className={`w-full h-full flex items-center justify-center relative transition-all ${el.type.startsWith("table_round")
                                                ? "rounded-full"
                                                : el.type === "chair"
                                                    ? "rounded-full"
                                                    : "rounded-lg"
                                            } ${isSelected
                                                ? "ring-2 ring-[#00E0FF] ring-offset-2 ring-offset-transparent shadow-lg"
                                                : "shadow-md"
                                            }`}
                                        style={{
                                            backgroundColor:
                                                el.color_tag === "default"
                                                    ? "rgba(255,255,255,0.9)"
                                                    : undefined,
                                            background:
                                                el.color_tag !== "default"
                                                    ? `linear-gradient(135deg, ${getColorHex(el.color_tag)}33, ${getColorHex(el.color_tag)}11)`
                                                    : undefined,
                                            border:
                                                el.type === "wall"
                                                    ? "none"
                                                    : `1px solid ${isSelected
                                                        ? "#00E0FF"
                                                        : el.color_tag !== "default"
                                                            ? getColorHex(el.color_tag)
                                                            : "rgba(0,0,0,0.08)"
                                                    }`,
                                        }}
                                    >
                                        {el.type === "wall" ? (
                                            <div className="w-full h-1 bg-slate-400 rounded-full" />
                                        ) : (
                                            <div className="text-center">
                                                {el.label && (
                                                    <p className="text-[10px] font-bold text-slate-700 dark:text-white truncate max-w-full px-1">
                                                        {el.label}
                                                    </p>
                                                )}
                                                {el.capacity > 0 && (
                                                    <p className="text-[9px] text-slate-500 dark:text-white/50">
                                                        {el.capacity}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {editMode && isSelected && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteElement(el.clientId);
                                                }}
                                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-adaptive-muted">
                            <Maximize2 className="h-10 w-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium">
                                {editMode ? "Drag tables from the left palette" : "No layout saved yet"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Properties Panel */}
                {editMode && selectedEl && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-64 shrink-0 rounded-2xl glass-adaptive-strong p-4 space-y-4 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-adaptive">Properties</h3>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="p-1 rounded-lg hover-adaptive text-adaptive-muted"
                            >
                                <EyeOff className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-adaptive-muted">
                                    Label
                                </label>
                                <input
                                    value={selectedEl.label}
                                    onChange={(e) => updateElement(selectedEl.clientId, { label: e.target.value })}
                                    className="w-full mt-1 rounded-xl px-3 py-2 text-sm glass-input outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-adaptive-muted">
                                        Capacity
                                    </label>
                                    <input
                                        type="number"
                                        value={selectedEl.capacity}
                                        onChange={(e) =>
                                            updateElement(selectedEl.clientId, { capacity: Number(e.target.value) })
                                        }
                                        className="w-full mt-1 rounded-xl px-3 py-2 text-sm glass-input outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-adaptive-muted">
                                        Rotation
                                    </label>
                                    <div className="flex items-center gap-1 mt-1">
                                        <input
                                            type="number"
                                            value={selectedEl.rotation}
                                            onChange={(e) =>
                                                updateElement(selectedEl.clientId, { rotation: Number(e.target.value) })
                                            }
                                            className="flex-1 rounded-xl px-3 py-2 text-sm glass-input outline-none"
                                        />
                                        <button
                                            onClick={() =>
                                                updateElement(selectedEl.clientId, {
                                                    rotation: (selectedEl.rotation + 90) % 360,
                                                })
                                            }
                                            className="p-2 rounded-xl glass-input hover-adaptive"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-adaptive-muted">
                                    Zone Color
                                </label>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                    {COLOR_TAGS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => updateElement(selectedEl.clientId, { color_tag: c.value })}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${selectedEl.color_tag === c.value
                                                    ? "ring-2 ring-[#00E0FF] bg-white/10"
                                                    : "hover:bg-white/5"
                                                }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-adaptive">
                                <span className="text-xs text-adaptive-muted">Visible</span>
                                <button
                                    onClick={() =>
                                        updateElement(selectedEl.clientId, { is_active: !selectedEl.is_active })
                                    }
                                    className={`p-1.5 rounded-lg transition-colors ${selectedEl.is_active ? "text-emerald-500" : "text-red-500"
                                        }`}
                                >
                                    {selectedEl.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>

                            <button
                                onClick={() => deleteElement(selectedEl.clientId)}
                                className="w-full py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold uppercase hover:bg-red-500/20 transition-colors"
                            >
                                Delete Element
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* View Mode Legend */}
                {!editMode && (
                    <div className="w-48 shrink-0 rounded-2xl glass-adaptive p-4 space-y-3">
                        <h3 className="text-xs font-bold text-adaptive">Legend</h3>
                        <div className="space-y-2">
                            {COLOR_TAGS.map((c) => (
                                <div key={c.value} className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                                    <span className="text-[11px] text-adaptive-muted">{c.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-adaptive pt-2">
                            <p className="text-[11px] text-adaptive-muted">
                                Total: <span className="font-bold text-adaptive">{totalSeats}</span> seats
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────── Helpers ─────────────── */
function getColorHex(tag: string): string {
    const map: Record<string, string> = {
        default: "#94a3b8",
        vip: "#f59e0b",
        smoking: "#ef4444",
        terrace: "#10b981",
        bar: "#a855f7",
    };
    return map[tag] || map.default;
}