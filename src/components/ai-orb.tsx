"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AIOrb({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
    return (
        <motion.button
            onClick={onClick}
            className="fixed z-50 flex items-center justify-center group"
            style={{ bottom: 24, right: 24, width: 56, height: 56 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.94 }}
        >
            {/* Outer rotating gradient ring */}
            <div
                className="absolute inset-0 rounded-full animate-orb opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                    background: "conic-gradient(from 0deg, #190E85, #CF00FF, #00E0FF, #03CF94, #190E85)",
                    filter: "blur(1px)",
                }}
            />
            {/* Middle glow pulse */}
            <div
                className="absolute inset-[-4px] rounded-full animate-orb-pulse"
                style={{
                    background: "radial-gradient(circle, rgba(0,224,255,0.3) 0%, transparent 70%)",
                }}
            />
            {/* Inner dark/light adaptive core */}
            <div className="absolute inset-[3px] rounded-full bg-white dark:bg-[#0a0a1a] flex items-center justify-center shadow-inner">
                <Sparkles className="h-5 w-5 text-[#190E85] dark:text-[#00E0FF] transition-colors" />
            </div>
            {/* Status dot */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#03CF94] border-2 border-white dark:border-[#0a0a1a]" />
            {/* Tooltip */}
            {!isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-full mr-3 px-3 py-1.5 rounded-xl glass-adaptive text-xs font-medium whitespace-nowrap pointer-events-none"
                >
                    Ask me anything
                </motion.div>
            )}
        </motion.button>
    );
}