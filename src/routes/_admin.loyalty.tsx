import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gift,
    Plus,
    X,
    Trash2,
    Edit3,
    Star,
    Crown,
    Medal,
    Users,
    Ticket,
} from "lucide-react";
import { getStorage, setStorage } from "@/lib/ssr-safe";
import { db } from "@/lib/db";
import { IOSBadge } from "@/components/ui/ios-badge";

export const Route = createFileRoute("/_admin/loyalty")({
    component: LoyaltyRoute,
});

interface Tier {
    id: string;
    name: string;
    minPoints: number;
    multiplier: number;
    color: string;
    benefits: string[];
}

interface Reward {
    id: string;
    name: string;
    pointsCost: number;
    description: string;
    active: boolean;
}

interface CustomerPoints {
    customerId: string;
    points: number;
    lifetimePoints: number;
    tierId: string;
}

const seedTiers = (): Tier[] => [
    { id: "bronze", name: "Bronze", minPoints: 0, multiplier: 1, color: "#CD7F32", benefits: ["Birthday reward"] },
    { id: "silver", name: "Silver", minPoints: 500, multiplier: 1.25, color: "#C0C0C0", benefits: ["Free delivery", "Priority support"] },
    { id: "gold", name: "Gold", minPoints: 1500, multiplier: 1.5, color: "#FFD700", benefits: ["Free delivery", "10% off", "Early access"] },
    { id: "platinum", name: "Platinum", minPoints: 5000, multiplier: 2, color: "#00E0FF", benefits: ["Free delivery", "15% off", "VIP events", "Dedicated line"] },
];

const seedRewards = (): Reward[] => [
    { id: "r1", name: "Free Fries", pointsCost: 100, description: "Complimentary fries with any order", active: true },
    { id: "r2", name: "$10 Voucher", pointsCost: 250, description: "Credit on next order", active: true },
    { id: "r3", name: "Free Burger", pointsCost: 500, description: "Any burger on the house", active: true },
    { id: "r4", name: "20% Off", pointsCost: 800, description: "One-time discount", active: false },
];

function getTierProgress(points: number, lifetime: number, tiers: Tier[]) {
    const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
    const currentIdx = sorted.findIndex((t) => lifetime >= t.minPoints);
    const currentTier = sorted[currentIdx] || sorted[0];
    const nextTier = sorted[currentIdx + 1];

    if (!nextTier) return { pct: 100, currentTier, nextTier: null };

    const range = nextTier.minPoints - currentTier.minPoints;
    const progress = lifetime - currentTier.minPoints;
    const pct = Math.min(100, Math.round((progress / range) * 100));

    return { pct, currentTier, nextTier };
}

function LoyaltyRoute() {
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [customerPoints, setCustomerPoints] = useState<CustomerPoints[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "rewards" | "members">("overview");
    const [modal, setModal] = useState<null | { type: "tier" | "reward"; data?: any }>(null);

    useEffect(() => {
        const loadedTiers = getStorage("ss_loyalty_tiers", seedTiers());
        setTiers(loadedTiers);
        setRewards(getStorage("ss_loyalty_rewards", seedRewards()));

        const customers = db.customers.getAll();
        const basePoints = customers.map((c) => ({
            customerId: c.id,
            points: Math.floor(Math.random() * 2000),
            lifetimePoints: Math.floor(Math.random() * 3000),
            tierId: "bronze",
        }));

        const points = getStorage<CustomerPoints[]>("ss_customer_points", basePoints);
        const updated = points.map((p) => {
            const matched = [...loadedTiers].reverse().find((t) => p.lifetimePoints >= t.minPoints);
            return { ...p, tierId: matched?.id || "bronze" };
        });

        setCustomerPoints(updated);
        setLoaded(true);
    }, []);

    const saveTiers = (all: Tier[]) => {
        setStorage("ss_loyalty_tiers", all);
        setTiers(all);
    };

    const saveRewards = (all: Reward[]) => {
        setStorage("ss_loyalty_rewards", all);
        setRewards(all);
    };

    const totalMembers = customerPoints.length;
    const avgPoints = totalMembers
        ? Math.round(customerPoints.reduce((a, b) => a + b.points, 0) / totalMembers)
        : 0;

    if (!loaded)
        return (
            <div className="h-96 flex items-center justify-center text-adaptive-muted">
                Loading loyalty...
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-adaptive">
                        Loyalty
                    </h1>
                    <p className="text-sm text-adaptive-muted">
                        {totalMembers} enrolled · {avgPoints} avg points
                    </p>
                </div>
                <div className="flex gap-2">
                    {(["overview", "rewards", "members"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${activeTab === t
                                    ? "bg-[#190E85] text-white"
                                    : "glass-adaptive text-adaptive"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                    <button
                        onClick={() =>
                            setModal({ type: activeTab === "rewards" ? "reward" : "tier" })
                        }
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="h-4 w-4" />{" "}
                        {activeTab === "rewards" ? "Reward" : "Tier"}
                    </button>
                </div>
            </div>

            {activeTab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            {
                                label: "Total Members",
                                value: totalMembers,
                                icon: Users,
                                color: "text-blue-500",
                            },
                            {
                                label: "Points Issued",
                                value: customerPoints.reduce((a, b) => a + b.lifetimePoints, 0),
                                icon: Star,
                                color: "text-amber-500",
                            },
                            {
                                label: "Active Rewards",
                                value: rewards.filter((r) => r.active).length,
                                icon: Gift,
                                color: "text-emerald-500",
                            },
                            {
                                label: "Redemptions",
                                value: 124,
                                icon: Ticket,
                                color: "text-purple-500",
                            },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="p-4 rounded-2xl glass-adaptive flex items-center gap-3"
                            >
                                <div
                                    className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 ${stat.color}`}
                                >
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-adaptive">{stat.value}</p>
                                    <p className="text-[11px] text-adaptive-muted">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tiers.map((tier) => (
                            <motion.div
                                key={tier.id}
                                whileHover={{ y: -4 }}
                                className="rounded-2xl glass-adaptive p-5 space-y-3 border-t-4"
                                style={{ borderTopColor: tier.color }}
                            >
                                <div className="flex items-center gap-2">
                                    <Crown
                                        className="h-5 w-5"
                                        style={{ color: tier.color }}
                                    />
                                    <h3 className="text-lg font-bold text-adaptive">
                                        {tier.name}
                                    </h3>
                                </div>
                                <p className="text-xs text-adaptive-muted">
                                    {tier.minPoints}+ points · {tier.multiplier}x multiplier
                                </p>
                                <div className="space-y-1">
                                    {tier.benefits.map((b) => (
                                        <div
                                            key={b}
                                            className="flex items-center gap-1.5 text-xs text-adaptive-muted"
                                        >
                                            <Medal className="h-3 w-3" style={{ color: tier.color }} />
                                            {b}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-bold text-adaptive">
                                    {customerPoints.filter((c) => c.tierId === tier.id).length}{" "}
                                    members
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "rewards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {rewards.map((reward, i) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="rounded-2xl glass-adaptive p-4 space-y-3 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center text-white">
                                        <Gift className="h-5 w-5" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() =>
                                                setModal({ type: "reward", data: reward })
                                            }
                                            className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85]"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                saveRewards(rewards.filter((r) => r.id !== reward.id))
                                            }
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-adaptive">
                                            {reward.name}
                                        </h3>
                                        {!reward.active && (
                                            <IOSBadge variant="secondary" size="sm">
                                                Inactive
                                            </IOSBadge>
                                        )}
                                    </div>
                                    <p className="text-xs text-adaptive-muted">
                                        {reward.description}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-adaptive">
                                    <span className="text-sm font-bold text-adaptive flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 text-amber-500" />
                                        {reward.pointsCost}
                                    </span>
                                    <button
                                        onClick={() =>
                                            saveRewards(
                                                rewards.map((r) =>
                                                    r.id === reward.id ? { ...r, active: !r.active } : r
                                                )
                                            )
                                        }
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${reward.active
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-red-500/10 text-red-500"
                                            }`}
                                    >
                                        {reward.active ? "Active" : "Off"}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {activeTab === "members" && (
                <div className="space-y-2">
                    {customerPoints.map((cp, i) => {
                        const customer = db.customers
                            .getAll()
                            .find((c) => c.id === cp.customerId);
                        if (!customer) return null;

                        const { pct, currentTier } = getTierProgress(
                            cp.points,
                            cp.lifetimePoints,
                            tiers
                        );

                        return (
                            <motion.div
                                key={cp.customerId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-4 p-4 rounded-2xl glass-adaptive hover:shadow-lg transition-shadow"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {customer.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-adaptive">
                                        {customer.name}
                                    </p>
                                    <p className="text-xs text-adaptive-muted">
                                        {cp.points} pts · {cp.lifetimePoints} lifetime
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: currentTier.color }}
                                    />
                                    <span className="text-xs font-medium text-adaptive">
                                        {currentTier.name}
                                    </span>
                                </div>
                                <div className="w-24 h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#190E85] to-[#00E0FF]"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {modal?.type === "tier" && (
                    <TierModal
                        tier={modal.data}
                        onClose={() => setModal(null)}
                        onSave={(data, id) => {
                            if (id)
                                saveTiers(tiers.map((t) => (t.id === id ? { ...t, ...data } : t)));
                            else
                                saveTiers([
                                    ...tiers,
                                    { ...data, id: Math.random().toString(36).slice(2, 8) },
                                ]);
                            setModal(null);
                        }}
                    />
                )}
                {modal?.type === "reward" && (
                    <RewardModal
                        reward={modal.data}
                        onClose={() => setModal(null)}
                        onSave={(data, id) => {
                            if (id)
                                saveRewards(
                                    rewards.map((r) => (r.id === id ? { ...r, ...data } : r))
                                );
                            else
                                saveRewards([
                                    ...rewards,
                                    {
                                        ...data,
                                        id: Math.random().toString(36).slice(2, 8),
                                        active: true,
                                    },
                                ]);
                            setModal(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function TierModal({
    tier,
    onClose,
    onSave,
}: {
    tier?: Tier;
    onClose: () => void;
    onSave: (d: any, id?: string) => void;
}) {
    const [form, setForm] = useState(
        tier || {
            name: "",
            minPoints: 0,
            multiplier: 1,
            color: "#CD7F32",
            benefits: [""],
        }
    );

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
                className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">
                        {tier ? "Edit Tier" : "New Tier"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input
                        placeholder="Tier name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            placeholder="Min Points"
                            value={form.minPoints}
                            onChange={(e) =>
                                setForm({ ...form, minPoints: Number(e.target.value) })
                            }
                            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                        />
                        <input
                            type="number"
                            placeholder="Multiplier"
                            value={form.multiplier}
                            onChange={(e) =>
                                setForm({ ...form, multiplier: Number(e.target.value) })
                            }
                            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                        />
                        <input
                            type="color"
                            value={form.color}
                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                            className="w-full h-10 rounded-xl border-0 p-0"
                        />
                    </div>
                    <button
                        onClick={() => onSave(form, tier?.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        {tier ? "Save Tier" : "Create Tier"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function RewardModal({
    reward,
    onClose,
    onSave,
}: {
    reward?: Reward;
    onClose: () => void;
    onSave: (d: any, id?: string) => void;
}) {
    const [form, setForm] = useState(
        reward || { name: "", pointsCost: 100, description: "" }
    );

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
                className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-adaptive">
                        {reward ? "Edit Reward" : "New Reward"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input
                        placeholder="Reward name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Points cost"
                        value={form.pointsCost}
                        onChange={(e) =>
                            setForm({ ...form, pointsCost: Number(e.target.value) })
                        }
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
                    />
                    <textarea
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                        className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none min-h-[60px]"
                    />
                    <button
                        onClick={() => onSave(form, reward?.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        {reward ? "Save Reward" : "Create Reward"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}