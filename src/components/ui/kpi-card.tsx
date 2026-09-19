import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string | number;
    delta?: number;
    deltaLabel?: string;
    icon?: LucideIcon;
    sparkline?: React.ReactNode;
    index?: number;
    onClick?: () => void;
}

export function KpiCard({
    label,
    value,
    delta,
    deltaLabel,
    icon: Icon,
    sparkline,
    index = 0,
    onClick,
}: KpiCardProps) {
    const isPositive = (delta ?? 0) >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onClick={onClick}
            className={`rounded-2xl glass-adaptive p-5 flex flex-col justify-between min-h-[120px] hover:shadow-lg transition-all ${onClick ? "cursor-pointer active:scale-[0.98]" : ""
                }`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-adaptive-muted">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-adaptive mt-1">{value}</p>
                </div>
                {Icon && (
                    <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-[#190E85] dark:text-[#00E0FF]">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mt-3">
                {delta !== undefined && (
                    <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${isPositive ? "text-emerald-500" : "text-red-500"
                            }`}
                    >
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositive ? "+" : ""}
                        {delta}%
                    </span>
                )}
                {deltaLabel && (
                    <span className="text-[11px] text-adaptive-muted">{deltaLabel}</span>
                )}
            </div>

            {sparkline && <div className="mt-3 h-8 w-full">{sparkline}</div>}
        </motion.div>
    );
}