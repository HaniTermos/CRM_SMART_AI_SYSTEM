"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function GlassTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

export function GlassTableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className)}>
      {children}
    </div>
  );
}

export function GlassTableRow({
  children,
  className,
  delay = 0,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      onClick={onClick}
      className={cn(
        "glass-row grid gap-4 px-4 py-3 items-center cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function GlassTableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
