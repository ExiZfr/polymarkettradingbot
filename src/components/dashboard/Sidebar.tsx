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
} from "lucide-react";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
};

const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
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
    const [balance] = useState(1000);

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
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Wallet size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Poly<span className="text-blue-600">GraalX</span>
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
                                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-900"
                                    : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon
                                        size={20}
                                        className={
                                            isActive
                                                ? "text-blue-600 dark:text-blue-500"
                                                : "text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                                        }
                                    />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    {/* Balance Card */}
                    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="mx-4 mt-auto mb-4 p-4 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20">
                                <span className="font-bold text-lg">PA</span>
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    Paper Account
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    Demo Trading
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <span>Balance</span>
                            <span className="font-mono text-green-600 dark:text-green-400 font-semibold">
                                ${balance.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={async () => {
                            document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            window.location.href = "/";
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
