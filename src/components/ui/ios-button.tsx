"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export const IOSButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "ghost" | "outline" | "glass" | "subtle" | "destructive" | "gradient";
    size?: "sm" | "md" | "lg" | "icon" | "pill";
    isLoading?: boolean;
  }
>(({ className, variant = "default", size = "md", isLoading, children, ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground shadow-sm hover:shadow-md",
    ghost: "bg-transparent hover:bg-accent/20",
    outline: "border border-input bg-transparent hover:bg-accent/10",
    glass: "glass-panel text-foreground hover:bg-white/80",
    subtle: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground",
    gradient: "bg-gradient-brand text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-10 px-4 text-sm rounded-xl",
    lg: "h-12 px-6 text-base rounded-2xl",
    icon: "h-10 w-10 rounded-xl",
    pill: "h-8 px-4 text-xs rounded-full",
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.95, y: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
});
IOSButton.displayName = "IOSButton";
