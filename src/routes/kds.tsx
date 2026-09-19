import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, CheckCircle2, Play, Volume2, VolumeX, Maximize2, Minimize2, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMyStore } from "@/lib/use-my-store";
import { useKitchenTickets, useUpdateTicketStatus } from "@/hooks/use-kds";

export const Route = createFileRoute("/kds")({
  component: KDSRoute,
});

const STATIONS = ["All", "Grill", "Cold", "Fryer", "Pizza", "Bar"];
const STATUSES = ["pending", "preparing", "ready"] as const;

const STATUS_CONFIG = {
  pending: { label: "NEW", color: "bg-blue-500", next: "preparing", btnText: "START" },
  preparing: { label: "IN PREP", color: "bg-amber-500", next: "ready", btnText: "READY" },
  ready: { label: "READY", color: "bg-emerald-500", next: "completed", btnText: "BUMP / SERVE" },
};

function KDSRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: store } = useMyStore();

  const [station, setStation] = useState("All");
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const prevCount = useRef(0);

  const { data: tickets = [] } = useKitchenTickets();
  const updateStatusMutation = useUpdateTicketStatus();

  /* ── Auth gate ── */
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  /* ── Sound alert on new orders ── */
  useEffect(() => {
    if (tickets.length > prevCount.current && soundOn && prevCount.current > 0) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
        // Audio block fallback
      }
    }
    prevCount.current = tickets.length;
  }, [tickets.length, soundOn]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center">
        <div className="animate-pulse text-[#00E0FF] font-semibold text-lg">
          Loading Kitchen Display System...
        </div>
      </div>
    );
  }

  // Filter tickets by station
  const filteredTickets = tickets.filter(
    (t) => station === "All" || t.station === station || t.station === "All"
  );

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* ── KDS Top Header (Isolated Fullscreen - No shell) ── */}
      <header className="px-6 py-3 bg-[#12122b] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#190E85] rounded-xl text-[#00E0FF] shadow-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#00E0FF]/10 text-[#00E0FF] font-mono">
                {store?.name || "Live Station"}
              </span>
            </h1>
            <p className="text-xs text-white/50">Auto-refreshing live orders queue (3s polling)</p>
          </div>
        </div>

        {/* Station Filter Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#0a0a1a] p-1 rounded-xl border border-white/10">
          {STATIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStation(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                station === s
                  ? "bg-[#190E85] text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-xl border transition ${
              soundOn
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-white/10 text-white/40 hover:bg-white/5"
            }`}
            title={soundOn ? "Mute audio alerts" : "Enable audio alerts"}
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition"
            title="Toggle fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── 3-Column Kanban Board ── */}
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {STATUSES.map((colStatus) => {
          const config = STATUS_CONFIG[colStatus];
          const colTickets = filteredTickets.filter((t) => {
            if (colStatus === "pending") return t.status === "pending";
            if (colStatus === "preparing") return t.status === "preparing" || t.status === "in_prep";
            if (colStatus === "ready") return t.status === "ready";
            return false;
          });

          return (
            <div
              key={colStatus}
              className="flex flex-col rounded-2xl bg-[#12122b]/70 border border-white/10 overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#12122b]">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${config.color}`} />
                  <h2 className="font-bold text-sm tracking-wider">{config.label}</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10">
                  {colTickets.length}
                </span>
              </div>

              {/* Tickets List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)]">
                <AnimatePresence mode="popLayout">
                  {colTickets.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-white/30 text-xs">
                      No tickets in {config.label}
                    </div>
                  ) : (
                    colTickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-xl bg-[#1a1a3a] border border-white/15 p-4 shadow-lg flex flex-col justify-between space-y-3"
                      >
                        {/* Ticket Top Meta */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xl font-extrabold text-white font-mono">
                              #{ticket.order_number}
                            </span>
                            {ticket.customer_name && (
                              <p className="text-xs text-white/60 mt-0.5">{ticket.customer_name}</p>
                            )}
                          </div>

                          {/* Table Label Tag */}
                          {ticket.table_label ? (
                            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              🪑 {ticket.table_label}
                            </div>
                          ) : (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/60">
                              Takeout / Direct
                            </span>
                          )}
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-1.5 py-2 border-y border-white/10">
                          {ticket.items && ticket.items.length > 0 ? (
                            ticket.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-white">
                                  {item.quantity}x {item.product_name}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-white/40 italic">Items loading or standard order...</p>
                          )}
                        </div>

                        {ticket.order_notes && (
                          <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            Note: {ticket.order_notes}
                          </p>
                        )}

                        {/* Bump Action Button */}
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: ticket.id,
                              status: config.next,
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md transition flex items-center justify-center gap-2 ${
                            colStatus === "pending"
                              ? "bg-blue-600 hover:bg-blue-500 text-white"
                              : colStatus === "preparing"
                              ? "bg-amber-600 hover:bg-amber-500 text-white"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          {colStatus === "pending" ? (
                            <Play className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          {config.btnText}
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}