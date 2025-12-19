"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Zap, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ComingSoonPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || "Plmktradingbot"

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div
          className="absolute top-0 left-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/30 blur-[120px] transition-transform duration-1000"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-purple-600/30 blur-[120px] transition-transform duration-1000"
          style={{
            transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`
          }}
        />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl space-y-12 text-center">
          {/* Logo & Title */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-sm font-medium text-zinc-300">In Development</span>
            </div>

            <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl md:text-8xl">
              Poly<span className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">GraalX</span>
            </h1>

            <h2 className="text-3xl font-semibold tracking-tight text-zinc-400 sm:text-4xl">
              Coming Soon
            </h2>

            <p className="mx-auto max-w-2xl text-lg text-zinc-500 sm:text-xl">
              The Ultimate Polymarket Trading Oracle powered by AI.
              <br />
              Smart Money Tracking + Volatility Mean Reversion.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-blue-500/50 hover:bg-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <TrendingUp className="mx-auto mb-4 h-10 w-10 text-blue-500" />
              <h3 className="mb-2 font-semibold">Crypto Oracle</h3>
              <p className="text-sm text-zinc-400">
                Real-time analysis of crypto price markets with smart money insights
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <Zap className="mx-auto mb-4 h-10 w-10 text-purple-500" />
              <h3 className="mb-2 font-semibold">Lightning Fast</h3>
              <p className="text-sm text-zinc-400">
                Instant order execution on Polymarket CLOB with maker rebates
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-cyan-500/50 hover:bg-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <Shield className="mx-auto mb-4 h-10 w-10 text-cyan-500" />
              <h3 className="mb-2 font-semibold">Secure & Private</h3>
              <p className="text-sm text-zinc-400">
                Your keys, your crypto. Non-custodial with strict security
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={`https://t.me/${BOT_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.83 14.33 15.5 16.08C15.36 16.82 15.08 17.07 14.81 17.09C14.22 17.14 13.77 16.7 13.2 16.33C12.31 15.74 11.81 15.38 10.95 14.81C9.95 14.15 10.6 13.79 11.17 13.2C11.32 13.04 13.92 10.68 13.97 10.46C13.98 10.43 13.98 10.33 13.92 10.28C13.86 10.22 13.77 10.24 13.7 10.26C13.6 10.28 12.08 11.24 9.14 13.23C8.71 13.52 8.32 13.67 7.85 13.66C7.33 13.64 6.34 13.36 5.6 13.12C4.7 12.83 3.98 12.67 4.04 12.17C4.07 11.91 4.43 11.64 5.1 11.37C9.28 9.45 12.06 8.25 13.45 7.67C17.42 6.03 18.23 5.74 18.77 5.74C18.89 5.74 19.16 5.77 19.33 5.91C19.47 6.03 19.51 6.19 19.52 6.3C19.52 6.37 19.53 6.64 19.51 6.84L16.64 8.8Z" />
              </svg>
              Join via Telegram
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-xl transition-all hover:border-white/40 hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>

          {/* Tech Stack */}
          <div className="pt-12">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-600">
              Powered By
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500">
              <div className="font-mono text-sm">Polymarket CLOB</div>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="font-mono text-sm">Polygon</div>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="font-mono text-sm">Web3</div>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="font-mono text-sm">AI Analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-zinc-500">
          <p>© 2025 PolyGraalX. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/about" className="hover:text-white transition">About</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
