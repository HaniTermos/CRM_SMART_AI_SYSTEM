import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Eye, Printer, Trash2, Plus, X, CheckCircle2, Clock, ChefHat, Package, Ban, Phone,
} from "lucide-react";
import { db, type Order } from "@/lib/db";
import { IOSBadge } from "@/components/ui/ios-badge";

const STATUS_FLOW: Order["status"][] = ["pending", "preparing", "ready", "delivered"];
const STATUS_META: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
  preparing: { icon: ChefHat, color: "text-blue-500", label: "Preparing" },
  ready: { icon: CheckCircle2, color: "text-emerald-500", label: "Ready" },
  delivered: { icon: Package, color: "text-slate-500", label: "Delivered" },
  cancelled: { icon: Ban, color: "text-red-500", label: "Cancelled" },
};

export const Route = createFileRoute("/_admin/orders")({
  component: OrdersRoute,
});

function OrdersRoute() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { type: "create" | "view"; order?: Order }>(null);

  // SSR-safe load
  useState(() => {
    if (typeof window !== "undefined") {
      setOrders(db.orders.getAll());
      setLoaded(true);
    }
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter = filter === "all" ? true : o.status === filter;
      const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [orders, filter, search]);

  const refresh = () => setOrders(db.orders.getAll());

  const advanceStatus = (order: Order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      db.orders.update(order.id, { status: STATUS_FLOW[idx + 1] });
      refresh();
    }
  };

  const cancelOrder = (id: string) => { db.orders.update(id, { status: "cancelled" }); refresh(); };
  const deleteOrder = (id: string) => { db.orders.delete(id); refresh(); };

  const createOrder = (data: Partial<Order>) => {
    const newOrder: Order = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customer: data.customer || "Walk-in",
      items: data.items || [{ name: "Custom Item", qty: 1, price: 0 }],
      status: "pending",
      type: data.type || "dine-in",
      total: data.total || 0,
      createdAt: new Date().toISOString(),
      table: data.table,
      note: data.note,
    };
    db.orders.add(newOrder);
    refresh();
    setModal(null);
  };

  if (!loaded) return <div className="h-96 flex items-center justify-center text-adaptive-muted">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-adaptive">Orders</h1>
          <p className="text-sm text-adaptive-muted">Manage and track all orders in real-time.</p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[#190E85]/20">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-adaptive-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none glass-input" />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "preparing", "ready", "delivered", "cancelled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${filter === f ? "bg-[#190E85] text-white border-[#190E85] shadow-md shadow-[#190E85]/20" : "glass-input border-transparent hover:border-gray-300 dark:hover:border-white/20"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="hidden md:grid grid-cols-[80px_1fr_100px_100px_100px_120px_100px_auto] gap-4 px-4 py-2 text-[11px] font-semibold text-adaptive-muted uppercase tracking-wider">
          <span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span>Type</span><span>Time</span><span></span>
        </div>
        <AnimatePresence>
          {filtered.map((order, i) => {
            const StatusIcon = STATUS_META[order.status]?.icon || Clock;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ delay: i * 0.03 }}
                className="group grid md:grid-cols-[80px_1fr_100px_100px_100px_120px_100px_auto] gap-4 px-4 py-3.5 rounded-2xl glass-adaptive items-center hover:shadow-lg transition-shadow">
                <span className="text-sm font-mono font-medium text-adaptive">{order.id}</span>
                <div>
                  <p className="text-sm font-medium text-adaptive">{order.customer}</p>
                  {order.phone && <p className="text-[11px] text-adaptive-muted">{order.phone}</p>}
                </div>
                <span className="text-sm text-adaptive">{order.items.reduce((a, b) => a + b.qty, 0)} items</span>
                <span className="text-sm font-semibold text-adaptive">${order.total.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-3.5 w-3.5 ${STATUS_META[order.status]?.color}`} />
                  <IOSBadge variant={order.status === "delivered" ? "success" : order.status === "ready" ? "aqua" : order.status === "pending" ? "warning" : order.status === "cancelled" ? "danger" : "secondary"} size="sm">{order.status}</IOSBadge>
                </div>
                <span className="text-xs text-adaptive-muted capitalize">{order.type}</span>
                <span className="text-xs text-adaptive-muted">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ type: "view", order })} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85] transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <button onClick={() => advanceStatus(order)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500 transition-colors"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                  )}
                  <button onClick={() => cancelOrder(order.id)} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-adaptive-muted hover:text-amber-500 transition-colors"><Ban className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteOrder(order.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modal?.type === "create" && <OrderCreateModal onClose={() => setModal(null)} onCreate={createOrder} />}
        {modal?.type === "view" && modal.order && <OrderViewModal order={modal.order} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}

function OrderCreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: Partial<Order>) => void }) {
  const [form, setForm] = useState({ customer: "", type: "dine-in", table: "", total: "", note: "" });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-adaptive">New Order</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <input placeholder="Customer name" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none">
              <option value="dine-in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
            <input placeholder="Table (optional)" value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          </div>
          <input placeholder="Total amount" type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <textarea placeholder="Note..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none min-h-[80px]" />
          <button onClick={() => onCreate({ ...form, total: Number(form.total) })} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity">Create Order</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrderViewModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl glass-adaptive-strong p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-semibold text-adaptive">{order.id}</h3><p className="text-sm text-adaptive-muted">{order.customer}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-adaptive"><span>{item.qty}x {item.name}</span><span className="font-medium">${(item.qty * item.price).toFixed(2)}</span></div>
          ))}
          <div className="border-t border-adaptive pt-2 flex justify-between font-semibold text-adaptive"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        </div>
        {order.note && <p className="text-xs text-adaptive-muted bg-adaptive-surface p-3 rounded-xl">Note: {order.note}</p>}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 py-2 rounded-xl bg-adaptive-surface text-adaptive text-sm font-medium hover-adaptive transition-colors flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print</button>
          <a href={`tel:${order.phone || ""}`} className="flex-1 py-2 rounded-xl bg-adaptive-surface text-adaptive text-sm font-medium hover-adaptive transition-colors flex items-center justify-center gap-2"><Phone className="h-4 w-4" /> Call</a>
        </div>
      </motion.div>
    </motion.div>
  );
}