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
    Menu,
    Bell,
    LogOut,
    Zap,
    ChevronRight,
    Receipt,
    Radio,
    X,
    AlertTriangle,
    TrendingUp,
    Info
} from "lucide-react";
import { RadarProvider, useRadar, ListenerLog } from "@/lib/radar-context";
import { WalletProvider } from "@/contexts/WalletContext";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
};

const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Live Signals", href: "/dashboard/signals", icon: TrendingUp, badge: "New" },
    { label: "Market Radar", href: "/dashboard/radar", icon: Radar },
    { label: "Listener", href: "/dashboard/listener", icon: Radio },
    { label: "Orders", href: "/dashboard/orders", icon: Receipt },
    { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Users },
    { label: "Oracle", href: "/dashboard/oracle", icon: Brain },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/**
 * Notification Panel Component - Only shows IMPORTANT notifications
 */
function NotificationPanel({ isOpen, onClose, logs }: { isOpen: boolean; onClose: () => void; logs: ListenerLog[] }) {
    // Normalize logs to handle both old (flat) and new (nested) formats
    const normalizeLog = (log: ListenerLog) => {
        // If relatedMarket already exists and has slug, return as-is
        if (log.relatedMarket?.slug) return log;

        // Check if log has flat structure (old format)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawLog = log as any;
        if (rawLog.slug || rawLog.relatedMarketId) {
            return {
                ...log,
                relatedMarket: {
                    id: rawLog.relatedMarketId || rawLog.marketId || log.relatedMarket?.id || '',
                    slug: rawLog.slug || '',
                    score: rawLog.score || log.relatedMarket?.score || 0,
                    title: rawLog.question || log.message?.split('|')[0]?.replace(/🎯|⚡|🔥/g, '').trim() || 'Market Signal',
                    volume: rawLog.volume || log.relatedMarket?.volume || '0',
                    probability: log.relatedMarket?.probability || 50,
                    image: log.relatedMarket?.image || ''
                }
            };
        }

        return log;
    };

    // Filter ONLY important notifications and normalize them
    const importantLogs = logs.filter(log =>
        log.priority === 'high' ||
        log.type === 'signal' ||
        log.type === 'alert' ||
        log.type === 'error'
    ).map(normalizeLog).slice(0, 15);

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'signal': return <TrendingUp className="text-green-400" size={14} />;
            case 'alert': return <AlertTriangle className="text-amber-400" size={14} />;
            case 'error': return <AlertTriangle className="text-red-400" size={14} />;
            default: return <Info className="text-blue-400" size={14} />;
        }
    };

    const getLogBg = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500/10 border-red-500/20';
            case 'medium': return 'bg-amber-500/10 border-amber-500/20';
            default: return 'bg-white/5 border-white/5';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-80 bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {importantLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
                            No important notifications
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {importantLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`rounded-xl border ${getLogBg(log.priority)} transition-all hover:bg-white/5 overflow-hidden`}
                                >
                                    {log.relatedMarket && (
                                        <div className="relative">
                                            <img
                                                src={log.relatedMarket.image}
                                                alt=""
                                                className="w-full h-20 object-cover opacity-80"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D12] to-transparent" />
                                            <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${log.relatedMarket.score >= 70 ? 'bg-green-500/90 text-black' :
                                                log.relatedMarket.score >= 50 ? 'bg-yellow-500/90 text-black' : 'bg-slate-500/80 text-white'
                                                }`}>
                                                🔥 {log.relatedMarket.score}
                                            </div>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                                                    {log.relatedMarket.title.slice(0, 60)}...
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5">{getLogIcon(log.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                {!log.relatedMarket && (
                                                    <p className="text-xs text-slate-300 leading-relaxed">{log.message}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 uppercase">{log.source}</span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                    {log.relatedMarket && (
                                                        <>
                                                            <span className="text-[10px] text-indigo-400">Vol: {log.relatedMarket.volume}</span>
                                                            <span className="text-[10px] text-green-400">{log.relatedMarket.probability}%</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {log.relatedMarket && (
                                            <div className="flex gap-2 mt-2">
                                                <Link
                                                    href={`/dashboard/signal/${log.signalId || log.relatedMarket.id}`}
                                                    onClick={onClose}
                                                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg text-center transition-all ${log.relatedMarket.score >= 70
                                                        ? 'bg-green-500 hover:bg-green-400 text-black'
                                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                                        }`}
                                                >
                                                    {log.relatedMarket.score >= 70 ? '⚡ Analyze Signal' : 'View Analysis'}
                                                </Link>
                                                <a
                                                    href={`https://polymarket.com/event/${log.relatedMarket.slug || log.relatedMarket.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-1.5 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-medium rounded-lg text-center transition-colors"
                                                >
                                                    Polymarket ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-white/5">
                    <Link
                        href="/dashboard/listener"
                        onClick={onClose}
                        className="block w-full py-2 text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        View All Activity →
                    </Link>
                </div>
            </motion.div>
        </>
    );
}

/**
 * Header Component
 */
function DashboardHeader({ toggleSidebar, pathname }: { toggleSidebar: () => void; pathname: string }) {
    return (
        <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-[#06070A]/80 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white hidden sm:block">
                        {navItems.find(i => i.href === pathname)?.label || "Dashboard"}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-400">System Online</span>
                </div>
            </div>
        </header>
    );
}

/**
 * Main Layout Component
 */
/**
 * Main Layout Component
 */
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <RadarProvider>
            <WalletProvider>
                <div className="min-h-screen bg-[#06070A] text-white flex overflow-hidden font-sans selection:bg-indigo-500/30">

                    <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#06070A] relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]"
                            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                        </div>

                        <DashboardHeader toggleSidebar={toggleSidebar} pathname={pathname} />

                        {/* Page Content */}
                        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </WalletProvider>
        </RadarProvider>
    );
}
