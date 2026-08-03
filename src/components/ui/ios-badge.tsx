"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const IOSBadge = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" | "aqua" | "violet";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "default", size = "md", children, ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-transparent text-foreground",
    destructive: "bg-red-500 text-white",
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-sky-500 text-white",
    aqua: "bg-[#00E0FF]/15 text-[#0066CC] border border-[#00E0FF]/30",
    violet: "bg-[#CF00FF]/15 text-[#8B00CF] border border-[#CF00FF]/30",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-[10px] rounded-md",
    md: "px-2.5 py-0.5 text-xs rounded-lg",
    lg: "px-3 py-1 text-sm rounded-xl",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
IOSBadge.displayName = "IOSBadge";
