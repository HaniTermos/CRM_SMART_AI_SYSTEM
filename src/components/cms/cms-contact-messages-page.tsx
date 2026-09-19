"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { IOSButton } from "@/components/ui/ios-button";
import { IOSBadge } from "@/components/ui/ios-badge";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useCmsContactMessages, useUpdateContactMsgStatus, useCmsContactMessageAnalytics } from "@/lib/use-cms-v2";
import {
  ChevronLeft, MessageSquare, Mail, Phone, Clock,
  CheckCircle2, XCircle, AlertCircle, Inbox, Filter, BarChart3
} from "lucide-react";

const STATUSES = [
  { value: "", label: "All", icon: Inbox },
  { value: "open", label: "Open", icon: AlertCircle },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "resolved", label: "Resolved", icon: CheckCircle2 },
  { value: "spam", label: "Spam", icon: XCircle },
];

const STATUS_COLORS: Record<string, "warning" | "info" | "success" | "destructive" | "secondary"> = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  spam: "destructive",
};

export function CmsContactMessagesPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const { data: messages = [], isLoading } = useCmsContactMessages(filterStatus || undefined);
  const { data: analytics, isLoading: analyticsLoading } = useCmsContactMessageAnalytics();
  const updateStatusMut = useUpdateContactMsgStatus();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link to="/cms" className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Contact Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{messages.length} messages</p>
        </div>
      </div>

      {/* Analytics */}
      {!analyticsLoading && analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <IOSCard className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><BarChart3 className="h-3.5 w-3.5" /> Total</div>
            <p className="text-xl font-bold">{analytics.total}</p>
          </IOSCard>
          <IOSCard className="p-3">
            <div className="flex items-center gap-2 text-amber-600 text-xs mb-1"><AlertCircle className="h-3.5 w-3.5" /> Open</div>
            <p className="text-xl font-bold">{analytics.by_status.open || 0}</p>
          </IOSCard>
          <IOSCard className="p-3">
            <div className="flex items-center gap-2 text-blue-600 text-xs mb-1"><Clock className="h-3.5 w-3.5" /> In Progress</div>
            <p className="text-xl font-bold">{analytics.by_status.in_progress || 0}</p>
          </IOSCard>
          <IOSCard className="p-3">
            <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1"><CheckCircle2 className="h-3.5 w-3.5" /> Resolved</div>
            <p className="text-xl font-bold">{analytics.by_status.resolved || 0}</p>
          </IOSCard>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUSES.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterStatus === s.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/10"
              )}
            >
              <Icon className="h-3 w-3" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      )}

      {/* Messages List */}
      {!isLoading && messages.length === 0 && (
        <IOSCard className="p-10 text-center">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold text-sm">No messages</p>
          <p className="text-xs text-muted-foreground mt-1">Contact form submissions will appear here.</p>
        </IOSCard>
      )}

      <div className="space-y-2">
        {messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <IOSCard
              className={cn("p-4 cursor-pointer hover:shadow-md transition-shadow", expanded === msg.id && "ring-1 ring-primary/30")}
              onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{msg.name}</span>
                    <IOSBadge variant={STATUS_COLORS[msg.status] || "secondary"} size="sm">{msg.status.replace("_", " ")}</IOSBadge>
                    {msg.topic && <IOSBadge variant="secondary" size="sm">{msg.topic}</IOSBadge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{msg.email}</span>
                    {msg.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{msg.phone}</span>}
                  </div>
                  <p className="text-xs mt-2 line-clamp-2 opacity-80">{msg.message}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap font-mono shrink-0">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>

              {expanded === msg.id && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {msg.status !== "resolved" && (
                      <IOSButton variant="default" size="pill" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); updateStatusMut.mutate({ id: msg.id, status: "resolved" }); }}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                      </IOSButton>
                    )}
                    {msg.status === "open" && (
                      <IOSButton variant="subtle" size="pill" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); updateStatusMut.mutate({ id: msg.id, status: "in_progress" }); }}>
                        <Clock className="h-3 w-3 mr-1" /> Mark In Progress
                      </IOSButton>
                    )}
                    {msg.status !== "spam" && (
                      <IOSButton variant="subtle" size="pill" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); updateStatusMut.mutate({ id: msg.id, status: "spam" }); }}>
                        <XCircle className="h-3 w-3 mr-1" /> Spam
                      </IOSButton>
                    )}
                  </div>
                </div>
              )}
            </IOSCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
