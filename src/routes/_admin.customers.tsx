import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Mail, Phone, Plus, Trash2, Edit3, X, Tag } from "lucide-react";
import { db, type Customer } from "@/lib/db";
import { IOSBadge } from "@/components/ui/ios-badge";

const SEGMENT_COLORS = { vip: "violet", active: "success", new: "aqua", dormant: "secondary" } as const;

export const Route = createFileRoute("/_admin/customers")({
  component: CustomersRoute,
});

function CustomersRoute() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { type: "create" | "edit"; customer?: Customer }>(null);

  useEffect(() => {
    setCustomers(db.customers.getAll());
    setLoaded(true);
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [customers, search]);

  const refresh = () => setCustomers(db.customers.getAll());

  const saveCustomer = (data: Partial<Customer>, id?: string) => {
    if (id) {
      db.customers.update(id, data);
    } else {
      db.customers.add({
        id: Math.random().toString(36).slice(2, 9),
        name: data.name || "New Customer",
        phone: data.phone || "",
        email: data.email,
        segment: (data.segment as any) || "new",
        totalSpent: Number(data.totalSpent) || 0,
        orderCount: Number(data.orderCount) || 0,
        notes: data.notes || "",
        tags: data.tags || [],
        lastOrder: "Just now",
      });
    }
    refresh();
    setModal(null);
  };

  const deleteCustomer = (id: string) => { db.customers.delete(id); refresh(); };

  if (!loaded) return <div className="h-96 flex items-center justify-center text-adaptive-muted">Loading guests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-adaptive">Guests</h1>
          <p className="text-sm text-adaptive-muted">Manage customer relationships and segments.</p>
        </div>
        <button onClick={() => setModal({ type: "create" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[#190E85]/20">
          <Plus className="h-4 w-4" /> Add Guest
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-adaptive-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or tag..."
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none glass-input"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl glass-adaptive hover:shadow-lg transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {c.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0 grid md:grid-cols-[1fr_120px_100px_100px_auto] gap-4 items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium text-adaptive truncate">{c.name}</p>
                <p className="text-xs text-adaptive-muted">{c.phone}</p>
                {c.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-md bg-adaptive-surface text-[10px] text-adaptive-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-adaptive">{c.orderCount} orders</p>
                <p className="text-xs text-adaptive-muted">${c.totalSpent} lifetime</p>
              </div>
              <IOSBadge variant={SEGMENT_COLORS[c.segment] || "secondary"} size="sm">
                {c.segment}
              </IOSBadge>
              <span className="text-xs text-adaptive-muted">{c.lastOrder}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={`tel:${c.phone}`} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-adaptive-muted hover:text-emerald-500 transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                </a>
                <a href={`mailto:${c.email || ""}`} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-adaptive-muted hover:text-blue-500 transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => setModal({ type: "edit", customer: c })}
                  className="p-1.5 rounded-lg hover:bg-[#190E85]/10 text-adaptive-muted hover:text-[#190E85] dark:hover:text-[#00E0FF] transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteCustomer(c.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-adaptive-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <CustomerModal
            key={modal.type + (modal.customer?.id || "new")}
            customer={modal.customer}
            onClose={() => setModal(null)}
            onSave={saveCustomer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer?: Customer;
  onClose: () => void;
  onSave: (d: Partial<Customer>, id?: string) => void;
}) {
  const [form, setForm] = useState<Partial<Customer>>(
    customer || {
      name: "",
      phone: "",
      email: "",
      segment: "new",
      totalSpent: 0,
      orderCount: 0,
      notes: "",
      tags: [],
    }
  );
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] });
    setTagInput("");
  };

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
        className="w-full max-w-md rounded-3xl glass-adaptive-strong p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-adaptive">
            {customer ? "Edit Guest" : "New Guest"}
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
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
            />
            <input
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
            />
          </div>
          <select
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value as any })}
            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
          >
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="dormant">Dormant</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Lifetime spent"
              type="number"
              value={form.totalSpent || 0}
              onChange={(e) => setForm({ ...form, totalSpent: Number(e.target.value) })}
              className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
            />
            <input
              placeholder="Order count"
              type="number"
              value={form.orderCount || 0}
              onChange={(e) => setForm({ ...form, orderCount: Number(e.target.value) })}
              className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
            />
          </div>
          <textarea
            placeholder="Notes..."
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm glass-input outline-none min-h-[80px]"
          />
          <div className="flex gap-2">
            <input
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm glass-input outline-none"
            />
            <button
              onClick={addTag}
              className="px-3 rounded-xl bg-adaptive-surface text-adaptive hover-adaptive transition-colors"
            >
              <Tag className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {form.tags?.map((t) => (
              <span
                key={t}
                className="px-2 py-1 rounded-lg bg-[#190E85]/10 text-[#190E85] dark:text-[#00E0FF] text-xs font-medium flex items-center gap-1"
              >
                {t}
                <button
                  onClick={() =>
                    setForm({ ...form, tags: form.tags?.filter((x) => x !== t) })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={() => onSave(form, customer?.id)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#190E85] to-[#CF00FF] text-white font-medium hover:opacity-90 transition-opacity"
          >
            {customer ? "Save Changes" : "Create Guest"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}