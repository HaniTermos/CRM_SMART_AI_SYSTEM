import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    UserCog,
    Plus,
    X,
    Trash2,
    Edit3,
    Clock,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Briefcase,
    Shield,
} from "lucide-react";
import { getStorage, setStorage } from "@/lib/ssr-safe";
import { IOSBadge } from "@/components/ui/ios-badge";

export const Route = createFileRoute("/_admin/staff")({
    component: StaffRoute,
});

interface StaffMember {
    id: string;
    name: string;
    role: "Owner" | "Manager" | "Chef" | "Server" | "Cashier" | "Delivery";
    email: string;
    phone: string;
    hourlyRate: number;
    active: boolean;
    joinedAt: string;
}

interface Shift {
    id: string;
    staffId: string;
    day: string;
    start: string;
    end: string;
    status: "scheduled" | "completed" | "absent";
}

const seedStaff = (): StaffMember[] => [
    { id: "st1", name: "You", role: "Owner", email: "owner@store.com", phone: "+961 70 000 000", hourlyRate: 0, active: true, joinedAt: "2025-01-15" },
    { id: "st2", name: "Rami H.", role: "Manager", email: "rami@store.com", phone: "+961 70 111 222", hourlyRate: 12, active: true, joinedAt: "2025-03-01" },
    { id: "st3", name: "Nadia S.", role: "Chef", email: "nadia@store.com", phone: "+961 70 333 444", hourlyRate: 10, active: true, joinedAt: "2025-04-10" },
    { id: "st4", name: "Karim B.", role: "Server", email: "karim@store.com", phone: "+961 70 555 666", hourlyRate: 6, active: true, joinedAt: "2025-06-01" },
    { id: "st5", name: "Lina M.", role: "Cashier", email: "lina@store.com", phone: "+961 70 777 888", hourlyRate: 7, active: false, joinedAt: "2025-05-15" },
];

const seedShifts = (): Shift[] => [
    { id: "sh1", staffId: "st2", day: "2026-08-03", start: "08:00", end: "16:00", status: "completed" },
    { id: "sh2", staffId: "st3", day: "2026-08-03", start: "10:00", end: "18:00", status: "scheduled" },
    { id: "sh3", staffId: "st4", day: "2026-08-03", start: "14:00", end: "22:00", status: "scheduled" },
    { id: "sh4", staffId: "st2", day: "2026-08-04", start: "08:00", end: "16:00", status: "scheduled" },
];

const ROLE_COLORS: Record<string, string> = {
    Owner: "violet",
    Manager: "aqua",
    Chef: "warning",
    Server: "success",
    Cashier: "secondary",
    Delivery: "danger",
};

function StaffRoute() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<"team" | "schedule">("team");
    const [modal, setModal] = useState<null | { type: "staff" | "shift"; data?: any }>(null);
    const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split("T")[0]);

    useEffect(() => {
        setStaff(getStorage("ss_staff", seedStaff()));
        setShifts(getStorage("ss_shifts", seedShifts()));
        setLoaded(true);
    }, []);

    const refreshStaff = () => { const s = getStorage("ss_staff", seedStaff()); setStaff(s); };
    const refreshShifts = () => { const s = getStorage("ss_shifts", seedShifts()); setShifts(s); };

    const saveStaff = (all: StaffMember[]) => { setStorage("ss_staff", all); setStaff(all); };
    const saveShifts = (all: Shift[]) => { setStorage("ss_shifts", all); setShifts(all); };

    if (!loaded) return <div className="h-96 flex items-center justify-center text-adaptive-muted">Loading staff...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-adaptive">Staff</h1>
                    <p className="text-sm text-adaptive-muted">{staff.filter((s) => s.active).length} active members · {shifts.filter((s) => s.status === "scheduled").length} shifts scheduled</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab("team")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "team" ? "bg-[#190E85] text-white" : "glass-adaptive text-adaptive"}`}>Team</button>
                    <button onClick={() => setActiveTab("schedule")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "schedule" ? "bg-[#190E85] text-white" : "glass-adaptive text-adaptive"}`}>Schedule</button>
                    <button onClick={() => setModal({ type: activeTab === "team" ? "staff" : "shift" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                        <Plus className="h-4 w-4" /> {activeTab === "team" ? "Member" : "Shift"}
                    </button>
                </div>
            </div>

            {activeTab === "team" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {staff.map((member, i) => (
                            <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl glass-adaptive p-4 space-y-3 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center text-white text-lg font-bold">
                                        {member.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setModal({ type: "staff", data: member })} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85]"><Edit3 className="h-3.5 w-3.5" /></button>
                                        {member.role !== "Owner" && (
                                            <button onClick={() => saveStaff(staff.filter((s) => s.id !== member.id))} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-adaptive">{member.name}</h3>
                                        {!member.active && <IOSBadge variant="secondary" size="sm">Inactive</IOSBadge>}
                                    </div>
                                    <p className="text-xs text-adaptive-muted">{member.email}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-adaptive">
                                    <IOSBadge variant={ROLE_COLORS[member.role] || "secondary"} size="sm">{member.role}</IOSBadge>
                                    <span className="text-xs text-adaptive-muted">${member.hourlyRate}/hr</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {activeTab === "schedule" && (
                <div className="space-y-4">
                    <input type="date" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                    <div className="space-y-2">
                        {shifts.filter((s) => s.day === selectedWeek).length === 0 && (
                            <div className="text-center py-16 text-adaptive-muted"><CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No shifts for this day</p></div>
                        )}
                        {shifts.filter((s) => s.day === selectedWeek).map((shift, i) => {
                            const member = staff.find((s) => s.id === shift.staffId);
                            return (
                                <motion.div key={shift.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 p-4 rounded-2xl glass-adaptive">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {member?.name.split(" ").map((n) => n[0]).join("") || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-adaptive">{member?.name || "Unknown"}</p>
                                        <p className="text-xs text-adaptive-muted">{shift.start} — {shift.end}</p>
                                    </div>
                                    <IOSBadge variant={shift.status === "completed" ? "success" : shift.status === "absent" ? "danger" : "warning"} size="sm">{shift.status}</IOSBadge>
                                    <div className="flex gap-1">
                                        <button onClick={() => saveShifts(shifts.map((s) => (s.id === shift.id ? { ...s, status: "completed" } : s)))} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500"><CheckCircle2 className="h-4 w-4" /></button>
                                        <button onClick={() => saveShifts(shifts.map((s) => (s.id === shift.id ? { ...s, status: "absent" } : s)))} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"><XCircle className="h-4 w-4" /></button>
                                        <button onClick={() => saveShifts(shifts.filter((s) => s.id !== shift.id))} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {modal?.type === "staff" && (
                    <StaffModal member={modal.data} onClose={() => setModal(null)} onSave={(data, id) => {
                        if (id) saveStaff(staff.map((s) => (s.id === id ? { ...s, ...data } : s)));
                        else saveStaff([...staff, { ...data, id: Math.random().toString(36).slice(2, 8), active: true, joinedAt: new Date().toISOString().split("T")[0] }]);
                        setModal(null);
                    }} />
                )}
                {modal?.type === "shift" && (
                    <ShiftModal staff={staff.filter((s) => s.active)} onClose={() => setModal(null)} onSave={(data) => {
                        saveShifts([...shifts, { ...data, id: Math.random().toString(36).slice(2, 8), status: "scheduled" }]);
                        setModal(null);
                    }} />
                )}
            </AnimatePresence>
        </div>
    );
}

function StaffModal({ member, onClose, onSave }: { member?: StaffMember; onClose: () => void; onSave: (d: any, id?: string) => void }) {
    const [form, setForm] = useState(member || { name: "", role: "Server", email: "", phone: "", hourlyRate: 6 });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">{member ? "Edit Member" : "New Team Member"}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-3">
                    <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none">
                            {["Manager", "Chef", "Server", "Cashier", "Delivery"].map((r) => <option key={r}>{r}</option>)}
                        </select>
                        <input type="number" placeholder="Hourly Rate" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                    </div>
                    <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                    <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                    <button onClick={() => onSave(form, member?.id)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity">{member ? "Save Changes" : "Hire Member"}</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ShiftModal({ staff, onClose, onSave }: { staff: StaffMember[]; onClose: () => void; onSave: (d: any) => void }) {
    const [form, setForm] = useState({ staffId: staff[0]?.id || "", day: new Date().toISOString().split("T")[0], start: "09:00", end: "17:00" });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl glass-adaptive-strong p-6 space-y-4">
                <h3 className="text-lg font-semibold text-adaptive">New Shift</h3>
                <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none">
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
                <input type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                <div className="grid grid-cols-2 gap-3">
                    <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                    <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
                </div>
                <button onClick={() => onSave(form)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium">Schedule Shift</button>
            </motion.div>
        </motion.div>
    );
}