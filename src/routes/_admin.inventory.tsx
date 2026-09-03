<<<<<<< HEAD
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  X,
  Trash2,
  Edit3,
  AlertTriangle,
  Phone,
  Mail,
  ArrowUpDown,
  TrendingDown,
  Clock,
  MapPin,
} from "lucide-react";
import { inventoryDb, type InventoryItem, type Supplier } from "@/lib/inventory-db";
import { IOSBadge } from "@/components/ui/ios-badge";

export const Route = createFileRoute("/_admin/inventory")({
  component: InventoryRoute,
});

function InventoryRoute() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "critical" | "expiring">("all");
  const [modal, setModal] = useState<null | { type: "item" | "supplier" | "restock"; data?: any }>(null);

  useEffect(() => {
    setItems(inventoryDb.items.getAll());
    setSuppliers(inventoryDb.suppliers.getAll());
    setLoaded(true);
  }, []);

  const refresh = () => {
    setItems(inventoryDb.items.getAll());
    setSuppliers(inventoryDb.suppliers.getAll());
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return "critical";
    if (item.currentStock < item.minStock) return "low";
    if (item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 3 * 86400000)) return "expiring";
    return "ok";
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
      const status = getStockStatus(item);
      const matchFilter = filterStatus === "all" ? true : status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [items, search, filterStatus]);

  const lowStockCount = items.filter((i) => getStockStatus(i) === "low" || getStockStatus(i) === "critical").length;

  if (!loaded) return <div className="h-96 flex items-center justify-center text-adaptive-muted">Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-adaptive">Inventory</h1>
          <p className="text-sm text-adaptive-muted">{items.length} SKUs tracked · {lowStockCount} need attention</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal({ type: "supplier" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-adaptive text-adaptive text-sm font-medium hover:shadow-lg transition-shadow">
            <Phone className="h-4 w-4" /> Suppliers
          </button>
          <button onClick={() => setModal({ type: "item" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total SKUs", value: items.length, icon: Package, color: "text-blue-500" },
          { label: "Low Stock", value: items.filter((i) => getStockStatus(i) === "low").length, icon: TrendingDown, color: "text-amber-500" },
          { label: "Critical", value: items.filter((i) => getStockStatus(i) === "critical").length, icon: AlertTriangle, color: "text-red-500" },
          { label: "Expiring Soon", value: items.filter((i) => getStockStatus(i) === "expiring").length, icon: Clock, color: "text-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl glass-adaptive flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-black/5 dark:bg-white/5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-adaptive">{stat.value}</p>
              <p className="text-[11px] text-adaptive-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-adaptive-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory..." className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none glass-input" />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "critical", "expiring"] as const).map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${filterStatus === f ? "bg-[#190E85] text-white border-[#190E85] shadow-md shadow-[#190E85]/20" : "glass-input border-transparent hover:border-gray-300 dark:hover:border-white/20"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        <div className="hidden md:grid grid-cols-[1fr_100px_100px_100px_100px_100px_80px_auto] gap-4 px-4 py-2 text-[11px] font-semibold text-adaptive-muted uppercase tracking-wider">
          <span>Item</span>
          <span>Stock</span>
          <span>Min/Max</span>
          <span>Unit Cost</span>
          <span>Status</span>
          <span>Location</span>
          <span>Expiry</span>
          <span></span>
        </div>
        <AnimatePresence>
          {filtered.map((item, i) => {
            const status = getStockStatus(item);
            const pct = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03 }}
                className="group grid md:grid-cols-[1fr_100px_100px_100px_100px_100px_80px_auto] gap-4 px-4 py-3.5 rounded-2xl glass-adaptive items-center hover:shadow-lg transition-shadow"
              >
                <div>
                  <p className="text-sm font-medium text-adaptive">{item.name}</p>
                  <p className="text-[11px] text-adaptive-muted">{item.category} · {item.unit}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-adaptive">{item.currentStock}</span>
                    <div className="w-12 h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${status === "critical" ? "bg-red-500" : status === "low" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-adaptive-muted">{item.minStock} / {item.maxStock}</span>
                <span className="text-sm text-adaptive">${item.unitCost.toFixed(2)}</span>
                <IOSBadge variant={status === "critical" ? "danger" : status === "low" ? "warning" : status === "expiring" ? "violet" : "success"} size="sm">
                  {status === "ok" ? "Healthy" : status}
                </IOSBadge>
                <span className="text-xs text-adaptive-muted flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
                <span className="text-xs text-adaptive-muted">{item.expiryDate || "—"}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ type: "restock", data: item })} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500 transition-colors" title="Restock">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setModal({ type: "item", data: item })} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted hover:text-[#190E85] transition-colors">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { inventoryDb.items.delete(item.id); refresh(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === "item" && (
          <ItemModal item={modal.data} suppliers={suppliers} onClose={() => setModal(null)} onSave={(data, id) => {
            if (id) inventoryDb.items.update(id, data);
            else inventoryDb.items.add({ ...data, id: Math.random().toString(36).slice(2, 8), lastRestocked: new Date().toISOString().split("T")[0] });
            refresh(); setModal(null);
          }} />
        )}
        {modal?.type === "supplier" && (
          <SupplierModal onClose={() => setModal(null)} suppliers={suppliers} onSave={() => refresh()} />
        )}
        {modal?.type === "restock" && modal.data && (
          <RestockModal item={modal.data} onClose={() => setModal(null)} onSave={(id, amount) => {
            const item = items.find((i) => i.id === id);
            if (item) {
              inventoryDb.items.update(id, { currentStock: item.currentStock + amount, lastRestocked: new Date().toISOString().split("T")[0] });
              refresh();
            }
            setModal(null);
          }} />
        )}
      </AnimatePresence>
=======
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useMyStore } from "@/lib/use-my-store";
import { adjustStock, listInventory } from "@/lib/inventory.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes, AlertTriangle, History, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/inventory")({
  component: InventoryPage,
});

type Reason = "manual" | "restock" | "correction" | "damage" | "return";

function InventoryPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", store?.id],
    enabled: !!store?.id,
    queryFn: () => listInventory({ data: { storeId: store!.id } }),
  });

  const adjust = useMutation({
    mutationFn: (input: {
      productId: string;
      delta: number;
      reason: Reason;
      note: string;
    }) =>
      adjustStock({
        data: {
          storeId: store!.id,
          productId: input.productId,
          delta: input.delta,
          reason: input.reason,
          note: input.note || null,
        },
      }),
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["inventory", store?.id] });
      qc.invalidateQueries({ queryKey: ["products", store?.id] });
      qc.invalidateQueries({ queryKey: ["alerts", store?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const products = data?.products ?? [];
  const adjustments = data?.adjustments ?? [];
  const lowStock = products.filter((p) => (p.stock ?? 0) < 5);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Boxes className="h-7 w-7 text-primary" />
          Inventory
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track stock levels and record adjustments.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total SKUs" value={products.length} />
        <StatCard label="Low stock (&lt;5)" value={lowStock.length} tone="warn" />
        <StatCard
          label="Total units"
          value={products.reduce((s, p) => s + (p.stock ?? 0), 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Stock levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <div className="divide-y">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        (p.stock ?? 0) < 5 ? "destructive" : "secondary"
                      }
                    >
                      {p.stock} in stock
                    </Badge>
                    <AdjustDialog
                      productName={p.name}
                      currentStock={p.stock ?? 0}
                      onSubmit={(delta, reason, note) =>
                        adjust.mutate({
                          productId: p.id,
                          delta,
                          reason,
                          note,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Recent adjustments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No adjustments recorded yet.
            </p>
          ) : (
            <div className="divide-y">
              {adjustments.map((a) => {
                const prod = productMap.get(a.product_id);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {prod?.name ?? "Unknown product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.reason}
                        {a.note ? ` · ${a.note}` : ""} ·{" "}
                        {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={a.delta >= 0 ? "secondary" : "destructive"}
                      className="shrink-0"
                    >
                      {a.delta > 0 ? `+${a.delta}` : a.delta}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
>>>>>>> ebf8e96b94724af6123191fffecb645770df3e69
    </div>
  );
}

<<<<<<< HEAD
function ItemModal({ item, suppliers, onClose, onSave }: { item?: InventoryItem; suppliers: Supplier[]; onClose: () => void; onSave: (d: any, id?: string) => void }) {
  const [form, setForm] = useState(item || { name: "", category: "", unit: "pcs", currentStock: 0, minStock: 0, maxStock: 100, reorderPoint: 10, unitCost: 0, supplierId: "", location: "", expiryDate: "" });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl glass-adaptive-strong p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-adaptive">{item ? "Edit Item" : "New Inventory Item"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <input type="number" placeholder="Current" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <input type="number" placeholder="Unit Cost" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input type="number" placeholder="Min Stock" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <input type="number" placeholder="Max Stock" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <input type="number" placeholder="Reorder Point" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none">
            <option value="">No Supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
        </div>
        <input type="date" placeholder="Expiry Date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
        <button onClick={() => onSave(form, item?.id)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity">{item ? "Save Changes" : "Create Item"}</button>
      </motion.div>
    </motion.div>
  );
}

function SupplierModal({ onClose, suppliers, onSave }: { onClose: () => void; suppliers: Supplier[]; onSave: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadTime, setLeadTime] = useState(1);

  const addSupplier = () => {
    if (!name.trim()) return;
    inventoryDb.suppliers.add({ id: Math.random().toString(36).slice(2, 8), name, phone, email, leadTime });
    setName(""); setPhone(""); setEmail(""); setLeadTime(1);
    onSave();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-adaptive">Suppliers</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover-adaptive text-adaptive-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl glass-input">
              <div>
                <p className="text-sm font-medium text-adaptive">{s.name}</p>
                <p className="text-[11px] text-adaptive-muted">{s.phone} · {s.leadTime}d lead time</p>
              </div>
              <button onClick={() => { inventoryDb.suppliers.delete(s.id); onSave(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-adaptive pt-4 space-y-3">
          <p className="text-xs font-semibold text-adaptive-muted uppercase tracking-wider">Add Supplier</p>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
            <input type="number" placeholder="Lead Time (days)" value={leadTime} onChange={(e) => setLeadTime(Number(e.target.value))} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          </div>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none" />
          <button onClick={addSupplier} className="w-full py-2 rounded-xl bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF] text-sm font-medium hover:bg-[#190E85]/20 transition-colors">Add Supplier</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RestockModal({ item, onClose, onSave }: { item: InventoryItem; onClose: () => void; onSave: (id: string, amount: number) => void }) {
  const [amount, setAmount] = useState(item.reorderPoint);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl glass-adaptive-strong p-6 space-y-4 text-center">
        <h3 className="text-lg font-semibold text-adaptive">Restock {item.name}</h3>
        <p className="text-sm text-adaptive-muted">Current: {item.currentStock} {item.unit} · Reorder point: {item.reorderPoint}</p>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none text-center text-lg font-bold" />
        <button onClick={() => onSave(item.id, amount)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium">Confirm Restock</button>
      </motion.div>
    </motion.div>
  );
}
=======
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            tone === "warn" && value > 0 ? "text-amber-600" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function AdjustDialog({
  productName,
  currentStock,
  onSubmit,
}: {
  productName: string;
  currentStock: number;
  onSubmit: (delta: number, reason: Reason, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("1");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState<Reason>("restock");
  const [note, setNote] = useState("");

  const submit = () => {
    const n = parseInt(amount, 10);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    const delta = direction === "add" ? n : -n;
    onSubmit(delta, reason, note);
    setOpen(false);
    setAmount("1");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current stock: <strong>{currentStock}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={direction === "add" ? "default" : "outline"}
              size="sm"
              onClick={() => setDirection("add")}
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
            <Button
              type="button"
              variant={direction === "remove" ? "default" : "outline"}
              size="sm"
              onClick={() => setDirection("remove")}
            >
              <Minus className="mr-1 h-3 w-3" /> Remove
            </Button>
          </div>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as Reason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="manual">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Shipment #1023"
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Save adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
>>>>>>> ebf8e96b94724af6123191fffecb645770df3e69
