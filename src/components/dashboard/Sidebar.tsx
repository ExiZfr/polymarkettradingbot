"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Wallet,
    Crosshair,
    BookOpen,
    Radar,
    Brain,
} from "lucide-react";
import AccountManagerWidget from "./AccountManagerWidget";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
};

const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Radar", href: "/dashboard/radar", icon: Radar, badge: "LIVE" },
    { label: "Sniper", href: "/dashboard/sniper", icon: Crosshair, badge: "New" },
    { label: "Carnet d'Ordres", href: "/dashboard/orders", icon: BookOpen },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({
    isSidebarOpen,
    setSidebarOpen,
}: {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}) {
    const pathname = usePathname();

    return (
        <>
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
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Wallet size={18} className="text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">
                            Poly<span className="text-primary">GraalX</span>
                        </span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon
                                        size={20}
                                        className={
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground group-hover:text-foreground transition-colors"
                                        }
                                    />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Section */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <AccountManagerWidget />

                    {/* Sign Out Button */}
                    <button
                        onClick={async () => {
                            document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            window.location.href = "/";
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
