"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
    Menu,
    Zap,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { ToastProvider } from "@/contexts/ToastContext";

/**
 * Header Component
 */
function DashboardHeader({ toggleSidebar }: { toggleSidebar: () => void }) {
    return (
        <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-[#06070A]/80 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Zap size={16} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white hidden sm:block">
                        PolyGraalX
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-400">Paper Mode</span>
                </div>
            </div>
        </header>
    );
}

/**
 * Main Layout Component
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <ToastProvider>
            <div className="min-h-screen bg-[#06070A] text-white flex overflow-hidden font-sans selection:bg-indigo-500/30">

                <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#06070A] relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                    </div>

                    <DashboardHeader toggleSidebar={toggleSidebar} />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
