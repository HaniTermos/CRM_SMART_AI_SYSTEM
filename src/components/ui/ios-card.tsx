"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

export const IOSCard = forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<"div">, "children"> & { isPressable?: boolean; glow?: boolean; children?: ReactNode }
>(({ className, isPressable = true, glow = false, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileTap={isPressable ? { scale: 0.985 } : undefined}
    transition={{ type: "spring", damping: 25, stiffness: 350 }}
    className={cn(
      "ios-card relative overflow-hidden",
      glow && "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-primary/5 before:to-accent/5 before:pointer-events-none",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
));
IOSCard.displayName = "IOSCard";
