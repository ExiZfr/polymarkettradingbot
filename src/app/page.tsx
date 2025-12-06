"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, BarChart3, Lock, Globe, Terminal } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navbar */}
        <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="bg-linear-to-tr from-blue-500 to-purple-500 p-2 rounded-lg">
              <Terminal size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Poly<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">GraalX</span></span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
            <span className="hover:text-white transition cursor-not-allowed">Features</span>
            <span className="hover:text-white transition cursor-not-allowed">Pricing</span>
            <span className="hover:text-white transition cursor-not-allowed">Docs</span>
          </nav>
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-bold rounded-lg border border-white/10 hover:bg-white/10 transition backdrop-blur-md"
          >
            Sign In
          </Link>
        </header>

        {/* Hero Section */}
        <main className="grow flex flex-col justify-center items-center px-4 py-20 text-center max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase mb-6">
              Version 2.3 Live
            </span>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Dominate <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-purple-400 to-pink-400">Polymarket</span> <br />
              with Algo Precision.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The advanced terminal for serious prediction market traders. <br className="hidden md:block" />
              Copy whales, snipe news, and visualize liquidity in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl transition hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Launch App
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 blur-lg -z-10 group-hover:opacity-100 opacity-0 transition-opacity" />
              </Link>

              <a
                href="https://t.me/Plmktradingbot"
                target="_blank"
                className="px-8 py-4 text-slate-300 font-bold rounded-xl border border-white/5 hover:bg-white/5 transition flex items-center gap-2"
              >
                <Globe size={18} />
                Join Community
              </a>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left"
          >
            <FeatureCard
              icon={Zap}
              title="Mempool Sniping"
              desc="Execute orders milliseconds after news breaks. Be the first to trade on AP, Reuters, and Twitter alerts."
              color="text-amber-400"
            />
            <FeatureCard
              icon={Shield}
              title="Whale Copy-Trading"
              desc="Automatically mirror the best traders on the platform. Track their PnL and copy their moves instantly."
              color="text-blue-400"
            />
            <FeatureCard
              icon={BarChart3}
              title="Advanced Analytics"
              desc="Visualize market depth, volume accumulation, and historical odds with our proprietary charting engine."
              color="text-purple-400"
            />
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-10 border-t border-white/5 text-center text-slate-600 text-sm">
          <p>© 2025 PolyGraalX. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition group">
      <div className={`p-3 rounded-lg bg-black/50 w-fit mb-4 ${color}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
