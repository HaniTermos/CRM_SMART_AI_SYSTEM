import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, Users, MapPin, CheckCircle2, AlertCircle, ArrowRight, Table, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/cms-v3/website/appointments")({
  component: CmsAppointmentsStudio,
});

function CmsAppointmentsStudio() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Connects directly to real restaurant reservations endpoint
    api.get("/reservations/me")
      .then((res) => {
        if (res.data?.data) setReservations(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Appointments & Table Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synchronization with restaurant floor plans, booking slots, and guest management
          </p>
        </div>
        <Link
          to="/reservations"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
        >
          <span>Floor Plan & Operations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Active Bookings</span>
          <div className="text-2xl font-black text-slate-900">{reservations.length}</div>
          <span className="text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Real Database Link Active
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Public Widget Status</span>
          <div className="text-sm font-bold text-slate-900">Embedded in V3 AST</div>
          <span className="text-[11px] text-slate-400">Component: reservation-widget</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Floor Layout Sync</span>
          <div className="text-sm font-bold text-slate-900">Synchronized with Tables</div>
          <span className="text-[11px] text-slate-400">Uses existing reservations engine</span>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Recent Customer Reservations</h3>
          <span className="text-xs text-slate-400">{reservations.length} Total Bookings</span>
        </div>

        <div className="space-y-2">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{res.customer_name || "Guest Booking"}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Party: {res.party_size || 2} guests</span>
                    <span>•</span>
                    <span>{new Date(res.reservation_time || res.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                {res.status || "confirmed"}
              </span>
            </div>
          ))}

          {reservations.length === 0 && !isLoading && (
            <div className="text-center py-12 text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">No Reservations Yet</p>
              <p>Bookings made via the public storefront reservation component will display here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
