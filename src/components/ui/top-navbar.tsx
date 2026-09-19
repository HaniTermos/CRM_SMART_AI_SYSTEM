import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    LayoutDashboard,
    ShoppingCart,
    UtensilsCrossed,
    CalendarDays,
    BarChart3,
    Settings,
    LogOut,
    ChevronDown,
    Bell,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", to: "/orders", icon: ShoppingCart },
    { label: "Menu", to: "/menu", icon: UtensilsCrossed },
    { label: "Reservations", to: "/reservations", icon: CalendarDays },
    { label: "Reports", to: "/reports", icon: BarChart3 },
];

export function TopNavbar() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
            <nav className="mx-auto max-w-7xl flex items-center justify-between px-5 py-2.5 rounded-2xl glass-adaptive-strong">
                {/* Brand */}
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#190E85] to-[#CF00FF] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#190E85]/20">
                            S
                        </div>
                        <span className="font-bold text-adaptive hidden sm:block text-sm tracking-tight">
                            SmartStore
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-0.5">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-adaptive-muted hover:text-adaptive hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <link.icon className="h-3.5 w-3.5" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <a
                        href="/shop/lumina-bistro"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#190E85] dark:text-[#00E0FF] bg-[#190E85]/5 dark:bg-[#00E0FF]/10 hover:bg-[#190E85]/10 transition-colors"
                    >
                        <Store className="h-3.5 w-3.5" />
                        View Shop
                    </a>

                    <button className="relative p-2 rounded-lg hover-adaptive text-adaptive-muted hover:text-adaptive transition-colors">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#CF00FF] border-2 border-white dark:border-[#0a0a1a]" />
                    </button>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover-adaptive transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#190E85] to-[#00E0FF] flex items-center justify-center text-white text-xs font-bold">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <ChevronDown className="h-3 w-3 text-adaptive-muted hidden sm:block" />
                        </button>

                        <AnimatePresence>
                            {profileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-52 rounded-xl glass-adaptive-strong border border-white/20 shadow-2xl py-1 overflow-hidden"
                                >
                                    <div className="px-3 py-2.5 border-b border-adaptive">
                                        <p className="text-sm font-semibold text-adaptive truncate">
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-[11px] text-adaptive-muted truncate">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            navigate({ to: "/settings" });
                                            setProfileOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-adaptive hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Settings className="h-4 w-4 text-adaptive-muted" />
                                        Settings
                                    </button>

                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("smartstore_token");
                                            window.location.href = "/login";
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>
        </header>
    );
}