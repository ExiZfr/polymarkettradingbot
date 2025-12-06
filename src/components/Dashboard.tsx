"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in
        // In a real implementation, we would fetch /api/me or check context
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-black text-white p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

            <header className="flex items-center justify-between py-6 border-b border-white/5 mb-8 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Poly<span className="text-blue-500">GraalX</span></h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-xs text-green-400 font-mono">SYSTEM ONLINE</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm text-white font-medium">Admin</p>
                        <p className="text-xs text-zinc-500">7139453099</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                        AD
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {/* Module: Market Monitor */}
                <div className="group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-blue-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-zinc-100">Market Sniper</h2>
                    <p className="text-sm text-zinc-400 mb-4">Ultra-low latency detection of new Polymarket events.</p>
                    <div className="flex items-center text-xs text-zinc-500 font-mono">
                        <span className="mr-2">LATENCY:</span>
                        <span className="text-green-400">0.45s</span>
                    </div>
                </div>

                {/* Module: Copy Trading */}
                <div className="group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-purple-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">Idle</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-zinc-100">Copy Trading</h2>
                    <p className="text-sm text-zinc-400">Replicate trades from whale wallets automatically.</p>
                </div>

                {/* Module: Settings */}
                <div className="group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-zinc-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-zinc-100">Configuration</h2>
                    <p className="text-sm text-zinc-400">System settings, API keys and wallets.</p>
                </div>
            </main>
        </div>
    );
}
