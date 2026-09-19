"use client";

import { motion } from "framer-motion";
import { IOSCard } from "@/components/ui/ios-card";
import { CheckCircle2, Circle, ChevronRight, Store, QrCode, Palette, Share2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCmsSettings } from "@/lib/use-cms-v2";
import { useMyStore } from "@/lib/use-my-store";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function OnboardingWidget() {
  const { data: cms } = useCmsSettings();
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const storeId = store?.id;

  const { data: qrList = [] } = useQuery({
    queryKey: ["qr-codes", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const res = await api.get(`/qr/${storeId}`);
      return res.data.data as any[];
    },
  });

  const hasLogo = !!cms?.logo_url;
  const hasColors = !!cms?.primary_color && cms.primary_color !== "#190E85";
  const hasPublishedHomepage = !!cms?.homepage_published;
  const hasQrCodes = qrList.length > 0;
  const hasStorefrontLink = !!store?.slug && hasPublishedHomepage;

  const tasks = [
    { id: 1, label: "Upload storefront logo", done: hasLogo, icon: <Store className="h-4 w-4" />, route: "/cms" },
    { id: 2, label: "Customize brand colors", done: hasColors, icon: <Palette className="h-4 w-4" />, route: "/cms" },
    { id: 3, label: "Publish homepage content", done: hasPublishedHomepage, icon: <Globe className="h-4 w-4" />, route: "/cms" },
    { id: 4, label: "Generate table QR codes", done: hasQrCodes, icon: <QrCode className="h-4 w-4" />, route: "/qr-manager" },
    { id: 5, label: "Share public storefront link", done: hasStorefrontLink, icon: <Share2 className="h-4 w-4" />, route: "/settings" },
  ];

  const completed = tasks.filter((t) => t.done).length;
  const progress = (completed / tasks.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <IOSCard className="p-5 glow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Getting Started</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completed}/{tasks.length} completed
            </p>
          </div>
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--muted)" strokeWidth="4" />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#190E85"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={125.6}
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 - (125.6 * progress) / 100 }}
                transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="space-y-1">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.05 }}
              onClick={() => navigate({ to: task.route as any })}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer",
                task.done ? "opacity-50" : "hover:bg-muted/60"
              )}
            >
              {task.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={cn("text-sm flex-1", task.done && "line-through text-muted-foreground")}>
                {task.label}
              </span>
              {!task.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </motion.div>
          ))}
        </div>
      </IOSCard>
    </motion.div>
  );
}
