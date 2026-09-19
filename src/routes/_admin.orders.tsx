import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { QuickActions, type ActionItem } from "@/components/ui/quick-actions";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/orders")({
  component: OrdersRoute,
});

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface AdminOrder {
  id: string;
  store_id: string;
  customer_id: string;
  order_number: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  table_label?: string;
  floor_id?: string;
  shipping_address?: any;
  notes?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  items?: OrderItem[];
}

function OrdersRoute() {
  const queryClient = useQueryClient();
  const { data: store } = useMyStore();
  const storeId = store?.id;

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", storeId],
    enabled: !!storeId,
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await api.get(`/orders/${storeId}`);
      return res.data.data as AdminOrder[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/orders/${storeId}/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Order status updated to ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", storeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update order status");
    },
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchFilter = filter === "all" ? true : o.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.table_label || "").toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [orders, filter, search]);

  const handlePrint = (order: AdminOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order #${order.order_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: auto; }
            h2 { text-align: center; margin-bottom: 5px; }
            .meta { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; pt: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>${store?.name || "SmartStore AI"}</h2>
          <div class="meta">
            <p>Order: #${order.order_number}</p>
            <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
            ${order.table_label ? `<p><strong>Table: ${order.table_label}</strong></p>` : ""}
          </div>
          <div>
            ${(order.items || [])
              .map((i) => `<div class="item"><span>${i.quantity}x ${i.product_name}</span><span>$${Number(i.subtotal).toFixed(2)}</span></div>`)
              .join("")}
          </div>
          <div class="total">
            <div class="item"><span>TOTAL</span><span>$${Number(order.total).toFixed(2)}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-adaptive">Orders Operations Manager</h1>
          <p className="text-sm text-adaptive-muted">
            Track real-time orders, table dine-in requests, KDS sync, and receipt printing.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-adaptive-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, table..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none glass-input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                filter === f
                  ? "bg-[#190E85] text-white border-[#190E85] shadow-md"
                  : "glass-input border-transparent hover:border-gray-300 dark:hover:border-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-adaptive rounded-2xl border border-white/20 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-adaptive-muted text-sm animate-pulse">
            Loading orders feed...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-adaptive-muted text-sm">
            No orders found matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-adaptive text-adaptive-muted font-semibold">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Table / Channel</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adaptive">
                {filteredOrders.map((o) => {
                  const quickActionsList: ActionItem[] = [
                    { id: "view", label: "View", type: "view", onClick: () => setSelectedOrder(o) },
                    { id: "confirm", label: "Confirm", type: "confirm", onClick: () => updateStatusMutation.mutate({ id: o.id, status: "confirmed" }), disabled: o.status === "confirmed" },
                    { id: "prep", label: "Prep", type: "start_prep", onClick: () => updateStatusMutation.mutate({ id: o.id, status: "confirmed" }), disabled: o.status === "shipped" },
                    { id: "deliver", label: "Deliver", type: "ready", onClick: () => updateStatusMutation.mutate({ id: o.id, status: "delivered" }), disabled: o.status === "delivered" },
                    { id: "cancel", label: "Cancel", type: "cancel", onClick: () => updateStatusMutation.mutate({ id: o.id, status: "cancelled" }), disabled: o.status === "cancelled" }
                  ];

                  return (
                    <tr key={o.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-adaptive">#{o.order_number}</td>
                      <td className="p-4">
                        {o.table_label ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <MapPin className="w-3.5 h-3.5" /> 🪑 Table {o.table_label}
                          </span>
                        ) : (
                          <span className="text-xs text-adaptive-muted font-mono">Storefront / Direct</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-adaptive">{o.customer_name || "Guest Customer"}</div>
                        <div className="text-xs text-adaptive-muted">{o.customer_phone || "—"}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          o.status === "pending"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : o.status === "confirmed"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : o.status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-adaptive">${Number(o.total).toFixed(2)}</td>
                      <td className="p-4 text-xs text-adaptive-muted">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <QuickActions actions={quickActionsList} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-adaptive max-w-lg w-full p-6 rounded-2xl border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-adaptive pb-3">
              <div>
                <h3 className="text-lg font-bold text-adaptive">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-adaptive-muted">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-adaptive"
              >
                ✕
              </button>
            </div>

            {selectedOrder.table_label && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Dine-in Table: {selectedOrder.table_label}
              </div>
            )}

            <div className="space-y-2 text-sm text-adaptive">
              <div className="flex justify-between py-1 border-b border-adaptive">
                <span className="text-adaptive-muted">Customer:</span>
                <span className="font-semibold">{selectedOrder.customer_name || "Guest"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-adaptive">
                <span className="text-adaptive-muted">Phone:</span>
                <span>{selectedOrder.customer_phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-adaptive">
                <span className="text-adaptive-muted">Payment:</span>
                <span className="capitalize">{selectedOrder.payment_method}</span>
              </div>
              {selectedOrder.notes && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-300">
                  Notes: {selectedOrder.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-adaptive">
              <button
                onClick={() => handlePrint(selectedOrder)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center gap-2 hover:opacity-90"
              >
                <Printer className="w-3.5 h-3.5" /> Print Thermal Receipt
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-adaptive text-adaptive hover:bg-black/5 dark:hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}