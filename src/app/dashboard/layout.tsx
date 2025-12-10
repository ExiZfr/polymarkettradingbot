"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useTheme } from "@/contexts/ThemeContext";

function DashboardHeader({ toggleSidebar }: { toggleSidebar: () => void }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <Menu size={24} />
                </button>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                    Poly<span className="text-blue-600">GraalX</span>
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun size={18} className="text-gray-700 dark:text-gray-300" />
                    ) : (
                        <Moon size={18} className="text-gray-700 dark:text-gray-300" />
                    )}
                </button>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Paper Mode</span>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex overflow-hidden font-sans selection:bg-blue-500/30">
            <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 relative">
                <DashboardHeader toggleSidebar={toggleSidebar} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
