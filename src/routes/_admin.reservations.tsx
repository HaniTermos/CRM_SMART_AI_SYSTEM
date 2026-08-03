import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Clock,
    Users,
    Plus,
    X,
    Phone,
    MessageCircle,
    CheckCircle2,
    Ban,
} from "lucide-react";
import { getStorage, setStorage } from "@/lib/ssr-safe";
import { IOSBadge } from "@/components/ui/ios-badge";

export const Route = createFileRoute("/_admin/reservations")({
    component: ReservationsRoute,
});

interface Reservation {
    id: string;
    customer: string;
    phone: string;
    guests: number;
    date: string;
    time: string;
    table: string;
    status: "confirmed" | "pending" | "seated" | "cancelled" | "no-show";
    notes: string;
}

const seedReservations = (): Reservation[] => [
    {
        id: "R001",
        customer: "Ahmad K.",
        phone: "+961 70 123 456",
        guests: 4,
        date: "2026-08-03",
        time: "19:00",
        table: "Table 5",
        status: "confirmed",
        notes: "Birthday",
    },
    {
        id: "R002",
        customer: "Sarah M.",
        phone: "+961 71 234 567",
        guests: 2,
        date: "2026-08-03",
        time: "19:30",
        table: "Table 2",
        status: "seated",
        notes: "",
    },
    {
        id: "R003",
        customer: "The Georges",
        phone: "+961 3 345 678",
        guests: 6,
        date: "2026-08-03",
        time: "20:00",
        table: "Table 8",
        status: "confirmed",
        notes: "Window seat",
    },
    {
        id: "R004",
        customer: "Layla H.",
        phone: "+961 76 456 789",
        guests: 3,
        date: "2026-08-03",
        time: "20:30",
        table: "Table 3",
        status: "pending",
        notes: "",
    },
];

const STATUS_STYLES: Record<string, { variant: any; label: string }> = {
    confirmed: { variant: "success", label: "Confirmed" },
    pending: { variant: "warning", label: "Pending" },
    seated: { variant: "aqua", label: "Seated" },
    cancelled: { variant: "danger", label: "Cancelled" },
    "no-show": { variant: "secondary", label: "No Show" },
};

function ReservationsRoute() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [modal, setModal] = useState<null | { type: "create" | "edit"; data?: Reservation }>(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

    useEffect(() => {
        setReservations(getStorage("ss_reservations", seedReservations()));
        setLoaded(true);
    }, []);

    const saveAll = (all: Reservation[]) => {
        setStorage("ss_reservations", all);
        setReservations(all);
    };

    const updateStatus = (id: string, status: Reservation["status"]) => {
        saveAll(reservations.map((r) => (r.id === id ? { ...r, status } : r)));
    };

    const filtered = reservations
        .filter((r) => r.date === filterDate)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (!loaded)
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Loading reservations...
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-adaptive">Reservations</h1>
                    <p className="text-sm text-adaptive-muted">
                        {filtered.length} bookings for {filterDate}
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <button
                        onClick={() => setModal({ type: "create" })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" /> Book
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {filtered.map((res, i) => (
                    <motion.div
                        key={res.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-2xl glass-adaptive hover:shadow-lg transition-shadow"
                    >
                        <div className="w-16 text-center shrink-0">
                            <p className="text-lg font-bold text-adaptive">{res.time}</p>
                            <p className="text-[10px] text-adaptive-muted">{res.date}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {res.customer
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-adaptive">{res.customer}</p>
                                {res.notes && (
                                    <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        {res.notes}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-adaptive-muted">
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {res.guests}
                                </span>
                                <span>{res.table}</span>
                                <span>{res.phone}</span>
                            </div>
                        </div>
                        <IOSBadge
                            variant={STATUS_STYLES[res.status]?.variant || "secondary"}
                            size="sm"
                        >
                            {STATUS_STYLES[res.status]?.label || res.status}
                        </IOSBadge>
                        <div className="flex items-center gap-1">
                            {res.status === "pending" && (
                                <button
                                    onClick={() => updateStatus(res.id, "confirmed")}
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>
                            )}
                            {(res.status === "pending" || res.status === "confirmed") && (
                                <button
                                    onClick={() => updateStatus(res.id, "seated")}
                                    className="p-1.5 rounded-lg hover:bg-blue-500/10 text-adaptive-muted hover:text-blue-500"
                                >
                                    <Users className="h-4 w-4" />
                                </button>
                            )}
                            <a
                                href={`https://wa.me/${res.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </a>
                            <a
                                href={`tel:${res.phone}`}
                                className="p-1.5 rounded-lg hover:bg-blue-500/10 text-adaptive-muted hover:text-blue-500"
                            >
                                <Phone className="h-4 w-4" />
                            </a>
                            <button
                                onClick={() => updateStatus(res.id, "cancelled")}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"
                            >
                                <Ban className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-adaptive-muted">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No reservations for this date</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {modal?.type === "create" && (
                    <ReservationModal
                        onClose={() => setModal(null)}
                        onSave={(data) => {
                            const newRes: Reservation = {
                                id: `R${Math.floor(100 + Math.random() * 900)}`,
                                ...data,
                                status: "pending",
                            };
                            saveAll([...reservations, newRes]);
                            setModal(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ReservationModal({
    onClose,
    onSave,
}: {
    onClose: () => void;
    onSave: (d: any) => void;
}) {
    const [form, setForm] = useState({
        customer: "",
        phone: "",
        guests: 2,
        date: new Date().toISOString().split("T")[0],
        time: "19:00",
        table: "",
        notes: "",
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4"
            >
                <h3 className="text-lg font-semibold text-adaptive">New Reservation</h3>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        placeholder="Name"
                        value={form.customer}
                        onChange={(e) => setForm({ ...form, customer: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                        value={form.guests}
                        onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                        className="w-full rounded-xl px-3 py-2.5 text-sm glass-input outline-none"
                    />
                </div>
                <input
                    placeholder="Table assignment"
                    value={form.table}
                    onChange={(e) => setForm({ ...form, table: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                />
                <input
                    placeholder="Notes (birthday, allergies...)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                />
                <button
                    onClick={() => onSave(form)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium"
                >
                    Create Reservation
                </button>
            </motion.div>
        </motion.div>
    );
}