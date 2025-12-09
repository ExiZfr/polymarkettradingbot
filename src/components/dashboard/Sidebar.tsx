"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Radar,
    Users,
    Brain,
    Settings,
    LogOut,
    Zap,
    ChevronRight,
    Receipt,
    Radio
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
};

const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Market Radar", href: "/dashboard/radar", icon: Radar, badge: "Live" },
    { label: "Listener", href: "/dashboard/listener", icon: Radio },
    { label: "Orders", href: "/dashboard/orders", icon: Receipt },
    { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Users },
    { label: "Oracle", href: "/dashboard/oracle", icon: Brain },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({
    isSidebarOpen,
    setSidebarOpen
}: {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}) {
    const pathname = usePathname();
    const { wallet } = useWallet();

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0A0B10] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">
                            Poly<span className="text-indigo-400">GraalX</span>
                        </span>
                    </Link>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white transition-colors"} />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 rounded-full animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                                {isActive && <ChevronRight size={16} className="text-indigo-400" />}
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile / Bottom Actions */}
                <div className="p-4 border-t border-white/5 bg-[#0C0D12]">
                    <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                                JD
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-sm font-bold text-white truncate">John Doe</div>
                                <div className="text-xs text-slate-400 truncate">Pro Plan</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 bg-black/20 rounded-lg p-2">
                            <span>Balance</span>
                            <span className="font-mono text-green-400">
                                ${wallet ? wallet.balance.toFixed(2) : '---'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                            window.location.href = '/';
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
