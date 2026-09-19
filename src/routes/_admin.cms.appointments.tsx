"use client";

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Utensils,
  UserCheck,
  AlertTriangle,
  X
} from "lucide-react";

export const Route = createFileRoute("/_admin/cms/appointments")({
  component: CmsAppointmentsPage,
});

interface AppointmentItem {
  id: string;
  guest_name: string;
  phone: string;
  email?: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  table_preference?: string;
  special_requests?: string;
  dietary_notes?: string;
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled";
  created_at: string;
}

function CmsAppointmentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["cms-appointments"],
    queryFn: async () => {
      const res = await api.get("/stores/me/cms/appointments");
      return res.data.data as AppointmentItem[];
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/stores/me/cms/appointments/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Reservation status updated!");
      queryClient.invalidateQueries({ queryKey: ["cms-appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update status");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stores/me/cms/appointments/${id}`);
    },
    onSuccess: () => {
      toast.success("Reservation deleted");
      queryClient.invalidateQueries({ queryKey: ["cms-appointments"] });
    },
  });

  // Form State
  const [form, setForm] = useState({
    guest_name: "",
    phone: "",
    email: "",
    reservation_date: new Date().toISOString().split("T")[0],
    reservation_time: "19:00",
    party_size: "2",
    table_preference: "indoor",
    special_requests: "",
    dietary_notes: "",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await api.post("/stores/me/cms/appointments", {
        ...form,
        party_size: Number(form.party_size),
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Reservation booked successfully!");
      setShowNewModal(false);
      setForm({
        guest_name: "",
        phone: "",
        email: "",
        reservation_date: new Date().toISOString().split("T")[0],
        reservation_time: "19:00",
        party_size: "2",
        table_preference: "indoor",
        special_requests: "",
        dietary_notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["cms-appointments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to create reservation");
    },
  });

  const filtered = appointments.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesQuery =
      !search ||
      item.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      (item.email || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-adaptive p-6 rounded-2xl border shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Table Reservations</h1>
            <IOSBadge variant="success" size="sm">Restaurant & Café</IOSBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage table bookings, guest preferences, dietary requirements, and dining party schedules.
          </p>
        </div>
        <IOSButton variant="default" size="md" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Booking
        </IOSButton>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <IOSCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Bookings</p>
            <p className="text-xl font-bold text-foreground">{appointments.length}</p>
          </div>
        </IOSCard>

        <IOSCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Approval</p>
            <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
          </div>
        </IOSCard>

        <IOSCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confirmed Tables</p>
            <p className="text-xl font-bold text-emerald-500">{confirmedCount}</p>
          </div>
        </IOSCard>

        <IOSCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guest Count</p>
            <p className="text-xl font-bold text-foreground">
              {appointments.reduce((sum, a) => sum + Number(a.party_size || 0), 0)}
            </p>
          </div>
        </IOSCard>
      </div>

      {/* Filters & Search */}
      <IOSCard className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {["all", "pending", "confirmed", "seated", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest or phone…"
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>
      </IOSCard>

      {/* Reservations List */}
      <IOSCard className="p-5 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">Loading reservations...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No table reservations match your filter.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{item.guest_name}</p>
                    <IOSBadge
                      variant={
                        item.status === "confirmed"
                          ? "success"
                          : item.status === "pending"
                          ? "warning"
                          : item.status === "seated"
                          ? "info"
                          : item.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                      size="sm"
                    >
                      {item.status}
                    </IOSBadge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {new Date(item.reservation_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {item.reservation_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {item.party_size} Guests ({item.table_preference || "indoor"})
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {item.phone}
                    </span>
                  </div>

                  {(item.special_requests || item.dietary_notes) && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg mt-1">
                      {item.dietary_notes && <p><strong>Dietary:</strong> {item.dietary_notes}</p>}
                      {item.special_requests && <p><strong>Requests:</strong> {item.special_requests}</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end">
                  {item.status === "pending" && (
                    <IOSButton
                      variant="default"
                      size="pill"
                      className="h-7 text-xs"
                      onClick={() => updateStatusMut.mutate({ id: item.id, status: "confirmed" })}
                    >
                      Confirm
                    </IOSButton>
                  )}
                  {item.status === "confirmed" && (
                    <IOSButton
                      variant="subtle"
                      size="pill"
                      className="h-7 text-xs"
                      onClick={() => updateStatusMut.mutate({ id: item.id, status: "seated" })}
                    >
                      Seat Party
                    </IOSButton>
                  )}
                  {item.status !== "completed" && item.status !== "cancelled" && (
                    <IOSButton
                      variant="subtle"
                      size="pill"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={() => updateStatusMut.mutate({ id: item.id, status: "cancelled" })}
                    >
                      Cancel
                    </IOSButton>
                  )}
                  <button
                    onClick={() => deleteMut.mutate(item.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </IOSCard>

      {/* New Booking Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">New Table Reservation</h3>
              <button onClick={() => setShowNewModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Guest Name</label>
                  <Input
                    placeholder="John Doe"
                    value={form.guest_name}
                    onChange={(e) => setForm((p) => ({ ...p, guest_name: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Phone</label>
                  <Input
                    placeholder="+1 555-0199"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={form.reservation_date}
                    onChange={(e) => setForm((p) => ({ ...p, reservation_date: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Time</label>
                  <Input
                    type="time"
                    value={form.reservation_time}
                    onChange={(e) => setForm((p) => ({ ...p, reservation_time: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Guests</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.party_size}
                    onChange={(e) => setForm((p) => ({ ...p, party_size: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-muted-foreground">Special Requests</label>
                <Textarea
                  placeholder="Window table, birthday, high chair..."
                  rows={2}
                  value={form.special_requests}
                  onChange={(e) => setForm((p) => ({ ...p, special_requests: e.target.value }))}
                  className="text-xs"
                />
              </div>

              <IOSButton
                variant="default"
                size="md"
                className="w-full"
                onClick={() => createMut.mutate()}
                disabled={createMut.isPending}
              >
                {createMut.isPending ? "Booking..." : "Confirm Booking"}
              </IOSButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
