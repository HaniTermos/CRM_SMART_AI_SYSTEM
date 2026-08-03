import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, CheckCircle2, Volume2, VolumeX } from "lucide-react";
import { db, type Order } from "@/lib/db";

export const Route = createFileRoute("/_admin/kitchen")({
    component: KitchenRoute,
});

const STATIONS = ["All", "Grill", "Cold", "Fryer", "Pizza", "Bar"];

function KitchenRoute() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [station, setStation] = useState("All");
    const [soundOn, setSoundOn] = useState(true);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const load = () => {
            const all = db.orders
                .getAll()
                .filter((o) => o.status === "pending" || o.status === "preparing");
            setOrders(all);
            setLoaded(true);
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    const bump = (id: string) => {
        db.orders.update(id, { status: "ready" });
        setOrders((prev) => prev.filter((o) => o.id !== id));
    };

    const filtered =
        station === "All"
            ? orders
            : orders.filter((o) =>
                o.items.some((i) => i.name.toLowerCase().includes(station.toLowerCase()))
            );

    if (!loaded)
        return (
            <div className="h-screen flex items-center justify-center text-adaptive-muted text-2xl">
                Loading KDS...
            </div>
        );

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col -mx-4 -my-6 px-4 py-6 bg-black/5 dark:bg-black/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-adaptive">Kitchen Display</h1>
                        <p className="text-xs text-adaptive-muted">{orders.length} active tickets</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {STATIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setStation(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${station === s
                                        ? "bg-[#190E85] text-white"
                                        : "bg-white/10 text-adaptive-muted hover:bg-white/20"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setSoundOn(!soundOn)}
                        className="p-2 rounded-lg bg-white/10 text-adaptive-muted hover:bg-white/20"
                    >
                        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                <AnimatePresence>
                    {filtered.map((order) => {
                        const age = Math.floor(
                            (Date.now() - new Date(order.createdAt).getTime()) / 60000
                        );
                        const isUrgent = age > 15;
                        return (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, x: 100 }}
                                className={`rounded-2xl p-4 space-y-3 border-2 ${isUrgent
                                        ? "bg-red-500/10 border-red-500/30"
                                        : "bg-white/80 dark:bg-white/5 border-white/20"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-adaptive">
                                            {order.id}
                                        </span>
                                        {order.table && (
                                            <span className="px-2 py-0.5 rounded-md bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF] text-xs font-bold">
                                                {order.table}
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 text-xs font-bold ${isUrgent ? "text-red-500" : "text-adaptive-muted"
                                            }`}
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        {age}m
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm text-adaptive">
                                            <span className="font-semibold">
                                                {item.qty}x {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {order.note && (
                                    <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                                        ⚠️ {order.note}
                                    </p>
                                )}
                                <button
                                    onClick={() => bump(order.id)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> BUMP — Ready
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {filtered.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-adaptive-muted">
                        <ChefHat className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p className="text-sm">No active tickets for {station}</p>
                    </div>
                )}
            </div>
        </div>
    );
}