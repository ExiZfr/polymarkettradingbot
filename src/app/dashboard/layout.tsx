"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import FloatingWalletWidget from "@/components/dashboard/FloatingWalletWidget";
import TradeNotificationSystem from "@/components/dashboard/TradeNotificationSystem";

function DashboardHeader({ toggleSidebar }: { toggleSidebar: () => void }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-muted-foreground hover:text-foreground lg:hidden transition-colors rounded-lg hover:bg-secondary"
                >
                    <Menu size={24} />
                </button>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">P</span>
                </div>
                <h1 className="text-xl font-bold text-foreground hidden sm:block">
                    Poly<span className="text-primary">GraalX</span>
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun size={18} className="text-foreground" />
                    ) : (
                        <Moon size={18} className="text-foreground" />
                    )}
                </button>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-500">Paper Mode</span>
                </div>
            </div>
        </header>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans selection:bg-primary/30">
            <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
                <DashboardHeader toggleSidebar={toggleSidebar} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10 scrollbar-hide">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Floating Wallet Widget (Bottom Left) */}
            <FloatingWalletWidget />

            {/* Trade Notification System (Top Right) */}
            <TradeNotificationSystem />
        </div>
    );
}

