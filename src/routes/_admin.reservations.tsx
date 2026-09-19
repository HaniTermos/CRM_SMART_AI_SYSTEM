import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    Users,
    Plus,
    Phone,
    MessageCircle,
    CheckCircle2,
    Ban,
    MapPin,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    X,
    Armchair,
    Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { IOSBadge } from "@/components/ui/ios-badge";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

export const Route = createFileRoute("/_admin/reservations")({
    component: ReservationsRoute,
});

const STATUS_STYLES: Record<string, { variant: any; label: string }> = {
    confirmed: { variant: "success", label: "Confirmed" },
    pending: { variant: "warning", label: "Pending" },
    seated: { variant: "aqua", label: "Seated" },
    cancelled: { variant: "danger", label: "Cancelled" },
    "no-show": { variant: "secondary", label: "No Show" },
};

interface Reservation {
    id: string;
    store_id: string;
    customer_name: string;
    customer_phone: string;
    guests: number;
    date: string;
    time: string;
    floor_id: string | null;
    table_label: string | null;
    status: "confirmed" | "pending" | "seated" | "cancelled" | "no-show";
    notes: string | null;
}

function ReservationsRoute() {
    const queryClient = useQueryClient();
    const { data: store } = useMyStore();
    const storeId = store?.id;

    const [view, setView] = useState<"list" | "calendar">("list");
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    /* ── Fetch list (single date + status) ── */
    const { data: reservations = [], isLoading } = useQuery({
        queryKey: ["reservations", storeId, filterDate, filterStatus],
        enabled: !!storeId && view === "list",
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterDate) params.append("date", filterDate);
            if (filterStatus !== "all") params.append("status", filterStatus);
            const res = await api.get(`/reservations/${storeId}?${params}`);
            return res.data.data as Reservation[];
        },
    });

    /* ── Fetch calendar month range ── */
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const monthStartStr = format(monthStart, "yyyy-MM-dd");
    const monthEndStr = format(monthEnd, "yyyy-MM-dd");

    const { data: monthReservations = [], isLoading: calendarLoading } = useQuery({
        queryKey: ["reservations", storeId, "month", monthStartStr, monthEndStr],
        enabled: !!storeId && view === "calendar",
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append("dateFrom", monthStartStr);
            params.append("dateTo", monthEndStr);
            const res = await api.get(`/reservations/${storeId}?${params}`);
            return res.data.data as Reservation[];
        },
    });

    const { data: floors = [] } = useQuery({
        queryKey: ["floors", storeId],
        enabled: !!storeId,
        queryFn: async () => {
            const res = await api.get(`/floors/${storeId}`);
            return res.data.data as { id: string; name: string }[];
        },
    });

    /* ── Mutations ── */
    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await api.put(`/reservations/${storeId}/${id}`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
            toast.success("Status updated");
        },
    });

    const createReservation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/reservations/${storeId}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
            setModalOpen(false);
            toast.success("Reservation created");
        },
    });

    /* ── Calendar helpers ── */
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const reservationsByDay = useMemo(() => {
        const source = view === "calendar" ? monthReservations : reservations;
        const map: Record<string, Reservation[]> = {};
        source.forEach((r) => {
            if (!map[r.date]) map[r.date] = [];
            map[r.date].push(r);
        });
        return map;
    }, [view, monthReservations, reservations]);

    /* ── Filtered list ── */
    const filteredList = useMemo(() => [...reservations].sort((a, b) => a.time.localeCompare(b.time)), [reservations]);

    const handleDayClick = useCallback((dateStr: string) => {
        setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
        setFilterDate(dateStr);
        setView("list");
    }, []);

    if (!storeId) {
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Create a store to manage reservations.
            </div>
        );
    }

    if (isLoading && view === "list") {
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading reservations...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-adaptive">Reservations</h1>
                    <p className="text-sm text-adaptive-muted">
                        {view === "list" ? filteredList.length : monthReservations.length} bookings
                        {view === "list" && filterDate ? ` for ${filterDate}` : ` in ${format(calendarDate, "MMMM yyyy")}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl glass-input p-1">
                        <button
                            onClick={() => setView("list")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "list" ? "bg-[#190E85] text-white" : "text-adaptive-muted"
                                }`}
                        >
                            <List className="h-3.5 w-3.5" /> List
                        </button>
                        <button
                            onClick={() => setView("calendar")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "calendar" ? "bg-[#190E85] text-white" : "text-adaptive-muted"
                                }`}
                        >
                            <Calendar className="h-3.5 w-3.5" /> Calendar
                        </button>
                    </div>
                    {view === "list" && (
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                        />
                    )}
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" /> Book
                    </button>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
                {["all", "pending", "confirmed", "seated", "cancelled", "no-show"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filterStatus === s
                                ? "bg-[#190E85] text-white shadow-md shadow-[#190E85]/20"
                                : "glass-input text-adaptive-muted hover:text-adaptive"
                            }`}
                    >
                        {s === "no-show" ? "No Show" : s}
                    </button>
                ))}
            </div>

            {/* ── LIST VIEW ── */}
            {view === "list" && (
                <div className="space-y-2">
                    {filteredList.map((res, i) => (
                        <motion.div
                            key={res.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-4 p-4 rounded-2xl glass-adaptive hover:shadow-lg transition-shadow group"
                        >
                            <div className="w-16 text-center shrink-0">
                                <p className="text-lg font-bold text-adaptive">{res.time.slice(0, 5)}</p>
                                <p className="text-[10px] text-adaptive-muted">{res.date.slice(5)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {res.customer_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-adaptive">{res.customer_name}</p>
                                    {res.notes && (
                                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                            {res.notes}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-adaptive-muted flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {res.guests}
                                    </span>
                                    {res.table_label && (
                                        <span className="flex items-center gap-1">
                                            <Armchair className="h-3 w-3" />
                                            {res.table_label}
                                        </span>
                                    )}
                                    {res.floor_id && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {floors.find((f) => f.id === res.floor_id)?.name || "Floor"}
                                        </span>
                                    )}
                                    <span>{res.customer_phone}</span>
                                </div>
                            </div>
                            <IOSBadge variant={STATUS_STYLES[res.status]?.variant || "secondary"} size="sm">
                                {STATUS_STYLES[res.status]?.label || res.status}
                            </IOSBadge>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {res.status === "pending" && (
                                    <button
                                        onClick={() => updateStatus.mutate({ id: res.id, status: "confirmed" })}
                                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                )}
                                {(res.status === "pending" || res.status === "confirmed") && (
                                    <button
                                        onClick={() => updateStatus.mutate({ id: res.id, status: "seated" })}
                                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-adaptive-muted hover:text-blue-500"
                                    >
                                        <Users className="h-4 w-4" />
                                    </button>
                                )}
                                <a
                                    href={`https://wa.me/${res.customer_phone?.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </a>
                                <a
                                    href={`tel:${res.customer_phone}`}
                                    className="p-1.5 rounded-lg hover:bg-blue-500/10 text-adaptive-muted hover:text-blue-500"
                                >
                                    <Phone className="h-4 w-4" />
                                </a>
                                {res.status !== "cancelled" && res.status !== "no-show" && (
                                    <>
                                        <button
                                            onClick={() => updateStatus.mutate({ id: res.id, status: "no-show" })}
                                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-adaptive-muted hover:text-amber-500"
                                        >
                                            <Ban className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => updateStatus.mutate({ id: res.id, status: "cancelled" })}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="text-center py-16 text-adaptive-muted">
                            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No reservations found</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── CALENDAR VIEW ── */}
            {view === "calendar" && (
                <div className="rounded-3xl glass-adaptive p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-adaptive">
                            {format(calendarDate, "MMMM yyyy")}
                            {calendarLoading && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                        </h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                                className="p-2 rounded-lg hover-adaptive text-adaptive"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                                className="p-2 rounded-lg hover-adaptive text-adaptive"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="text-center text-[10px] font-bold uppercase text-adaptive-muted py-1">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day) => {
                            const dateStr = format(day, "yyyy-MM-dd");
                            const dayRes = reservationsByDay[dateStr] || [];
                            const isToday = isSameDay(day, new Date());
                            const isSelected = selectedDay === dateStr;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => handleDayClick(dateStr)}
                                    className={`relative aspect-square rounded-xl p-1.5 text-left transition-all ${isToday
                                            ? "ring-2 ring-[#190E85] dark:ring-[#00E0FF]"
                                            : ""
                                        } ${isSelected
                                            ? "bg-[#190E85]/10 dark:bg-[#00E0FF]/10"
                                            : "hover:bg-black/5 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <span className={`text-sm font-bold ${isToday ? "text-[#190E85] dark:text-[#00E0FF]" : "text-adaptive"}`}>
                                        {format(day, "d")}
                                    </span>
                                    {dayRes.length > 0 && (
                                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap gap-0.5">
                                            {dayRes.slice(0, 3).map((r, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`h-1.5 w-1.5 rounded-full ${r.status === "confirmed"
                                                            ? "bg-emerald-500"
                                                            : r.status === "pending"
                                                                ? "bg-amber-500"
                                                                : r.status === "seated"
                                                                    ? "bg-[#00E0FF]"
                                                                    : "bg-red-500"
                                                        }`}
                                                />
                                            ))}
                                            {dayRes.length > 3 && (
                                                <span className="text-[8px] text-adaptive-muted leading-none">+{dayRes.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── BOOKING MODAL ── */}
            <AnimatePresence>
                {modalOpen && (
                    <BookingModal
                        storeId={storeId!}
                        floors={floors}
                        onClose={() => setModalOpen(false)}
                        onSave={(data) => createReservation.mutate(data)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────── Booking Modal ─────────────── */
function BookingModal({
    storeId,
    floors,
    onClose,
    onSave,
}: {
    storeId: string;
    floors: { id: string; name: string }[];
    onClose: () => void;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState({
        customer_name: "",
        customer_phone: "",
        guests: 2,
        date: new Date().toISOString().split("T")[0],
        time: "19:00",
        floor_id: floors[0]?.id || "",
        table_label: "",
        notes: "",
    });

    const [floorPickerOpen, setFloorPickerOpen] = useState(false);

    const { data: floorData } = useQuery({
        queryKey: ["floor", storeId, form.floor_id],
        queryFn: async () => {
            if (!form.floor_id) return null;
            const res = await api.get(`/floors/${storeId}/${form.floor_id}`);
            return res.data.data;
        },
        enabled: !!storeId && !!form.floor_id,
    });

    const tables = useMemo(() => {
        if (!floorData?.layouts?.length) return [];
        const layout = floorData.layouts.find((l: any) => l.is_default) || floorData.layouts[0];
        return (layout?.elements || []).filter((e: any) => e.type.startsWith("table") && e.is_active);
    }, [floorData]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-3xl glass-adaptive-strong p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">New Reservation</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <input
                        placeholder="Guest name"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <input
                        placeholder="Phone"
                        value={form.customer_phone}
                        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full rounded-xl px-3 py-2.5 text-sm glass-input outline-none"
                    />
                    <input
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="w-full rounded-xl px-3 py-2.5 text-sm glass-input outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Guests"
                        min={1}
                        value={form.guests}
                        onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                        className="w-full rounded-xl px-3 py-2.5 text-sm glass-input outline-none"
                    />
                </div>

                {/* Floor & Table */}
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            value={form.floor_id}
                            onChange={(e) => setForm({ ...form, floor_id: e.target.value, table_label: "" })}
                            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                        >
                            {floors.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                        <div className="relative">
                            <button
                                onClick={() => setFloorPickerOpen(!floorPickerOpen)}
                                className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm glass-input outline-none text-left"
                            >
                                <span className={form.table_label ? "text-adaptive" : "text-slate-400 dark:text-white/30"}>
                                    {form.table_label || "Pick a table..."}
                                </span>
                                <LayoutGrid className="h-4 w-4 text-adaptive-muted" />
                            </button>
                        </div>
                    </div>

                    {/* Mini Floor Picker */}
                    <AnimatePresence>
                        {floorPickerOpen && tables.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="rounded-xl glass-adaptive p-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {tables.map((t: any) => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setForm({ ...form, table_label: t.label });
                                                setFloorPickerOpen(false);
                                            }}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${form.table_label === t.label
                                                    ? "bg-[#190E85]/10 ring-1 ring-[#190E85] dark:ring-[#00E0FF]"
                                                    : "hover:bg-black/5 dark:hover:bg-white/5"
                                                }`}
                                        >
                                            <Armchair className="h-5 w-5 text-adaptive-muted" />
                                            <span className="text-[10px] font-bold text-adaptive">{t.label}</span>
                                            <span className="text-[9px] text-adaptive-muted">{t.capacity}p</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <input
                    placeholder="Notes (birthday, allergies, window seat...)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                />

                <button
                    onClick={() => onSave(form)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity"
                >
                    Create Reservation
                </button>
            </motion.div>
        </motion.div>
    );
}
