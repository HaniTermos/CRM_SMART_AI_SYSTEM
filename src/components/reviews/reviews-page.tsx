"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IOSBadge } from "@/components/ui/ios-badge";
import { GlassTable, GlassTableRow, GlassTableCell } from "@/components/ui/glass-table";
import {
  Star, MessageSquare, Eye, EyeOff, Trash2, Reply, Search, Filter,
  ThumbsUp, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEWS = [
  { id: 1, customer: "Majed H.", avatar: "M", rating: 5, product: "Shawarma Plate", comment: "Best shawarma in Beirut! The garlic sauce is incredible.", status: "approved", date: "6/15/2026", verified: true, likes: 12 },
  { id: 2, customer: "Sarah M.", avatar: "S", rating: 4, product: "Fattoush Salad", comment: "Great quality product! Highly recommended. Fresh and tasty.", status: "approved", date: "5/20/2026", verified: true, likes: 8 },
  { id: 3, customer: "Ahmad K.", avatar: "A", rating: 5, product: "Mixed Grill", comment: "Amazing portion size. Perfect for sharing with family.", status: "pending", date: "5/18/2026", verified: false, likes: 3 },
  { id: 4, customer: "Layla H.", avatar: "L", rating: 2, product: "Lentil Soup", comment: "Too salty for my taste. Expected better.", status: "hidden", date: "5/15/2026", verified: true, likes: 0 },
  { id: 5, customer: "George T.", avatar: "G", rating: 5, product: "Kunafa", comment: "The best dessert I have ever had. Will order again!", status: "approved", date: "5/10/2026", verified: true, likes: 24 },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [search, setSearch] = useState("");

  const filtered = REVIEWS.filter(r =>
    (filter === "all" ? true : r.status === filter) &&
    (search ? r.customer.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase()) || r.comment.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">Moderate customer reviews. New submissions land in Pending.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Average Rating", value: avgRating, icon: <Star className="h-4 w-4 text-amber-400" /> },
          { label: "Total Reviews", value: REVIEWS.length, icon: <MessageSquare className="h-4 w-4 text-primary" /> },
          { label: "Pending", value: REVIEWS.filter(r => r.status === "pending").length, icon: <Flag className="h-4 w-4 text-amber-500" /> },
          { label: "Response Rate", value: "85%", icon: <Reply className="h-4 w-4 text-emerald-500" /> },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">{stat.icon}</div>
            <div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
          {(["all", "pending", "approved", "hidden"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize",
                filter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border/40" />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((review, i) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#00E0FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {review.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{review.customer}</p>
                      {review.verified && <IOSBadge variant="aqua" size="sm">Verified</IOSBadge>}
                      <IOSBadge variant={review.status === "approved" ? "success" : review.status === "pending" ? "warning" : "secondary"} size="sm">
                        {review.status}
                      </IOSBadge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-muted-foreground">on <span className="text-primary font-medium">{review.product}</span></span>
                    </div>
                    <p className="text-sm text-foreground mt-2 leading-relaxed">{review.comment}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground">{review.date}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {review.likes}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Reply">
                    <Reply className="h-4 w-4" />
                  </button>
                  {review.status !== "hidden" ? (
                    <button className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-colors" title="Hide">
                      <EyeOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors" title="Show">
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
