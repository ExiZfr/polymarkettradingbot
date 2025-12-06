"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in
        // In a real implementation, we would fetch /api/me or check context
        // Here we assume if they reached this page via middleware (or redirect), they are good.
        // But for client-side rendering, let's verify cookie/session presence or params.

        // For now, we'll just show the UI as if logged in.
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-black text-white p-6">
            <header className="flex items-center justify-between py-4 border-b border-white/10 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Poly<span className="text-blue-500">Bot</span></h1>
                    <p className="text-xs text-green-400 font-mono mt-1">● SYSTEM ONLINE</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">Admin</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                        AD
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Module: Market Monitor */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-blue-500/50 transition cursor-pointer">
                    <h2 className="text-xl font-semibold mb-2 text-blue-400">⚡ Market Sniper</h2>
                    <p className="text-sm text-zinc-500">Monitor new markets and execute trades instantly.</p>
                    <div className="mt-4 flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Active</span>
                        <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">0.5s Latency</span>
                    </div>
                </div>

                {/* Module: Copy Trading */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-purple-500/50 transition cursor-pointer">
                    <h2 className="text-xl font-semibold mb-2 text-purple-400">👥 Copy Trading</h2>
                    <p className="text-sm text-zinc-500">Automatically copy trades from top-performing wallets.</p>
                    <div className="mt-4 flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">Idle</span>
                    </div>
                </div>

                {/* Module: Settings */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-white/30 transition cursor-pointer">
                    <h2 className="text-xl font-semibold mb-2 text-zinc-100">⚙️ Configuration</h2>
                    <p className="text-sm text-zinc-500">Manage API keys, wallets and risk parameters.</p>
                </div>
            </main>
        </div>
    );
}
