import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Features from "@/components/landing/Features";
import RadarShowcase from "@/components/landing/RadarShowcase";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

// SEO Metadata
export const metadata: Metadata = {
  title: "PolyGraalX - AI-Powered Polymarket Trading Bot",
  description: "Dominate Polymarket with AI precision. Automated trading bot featuring real-time market radar, precision sniping, copy trading, and AI-powered predictions. Start trading smarter today.",
  keywords: ["polymarket", "trading bot", "prediction markets", "crypto trading", "ai trading", "automated trading", "copy trading", "market analysis"],
  authors: [{ name: "PolyGraalX Team" }],
  openGraph: {
    title: "PolyGraalX - AI-Powered Polymarket Trading Bot",
    description: "Dominate Polymarket with AI precision. Automated trading with real-time sniping and copy trading.",
    type: "website",
    url: "https://app.polygraalx.app",
    siteName: "PolyGraalX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PolyGraalX Trading Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PolyGraalX - AI-Powered Polymarket Trading Bot",
    description: "Dominate Polymarket with AI precision. Automated trading with real-time sniping.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function LandingPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
        <Navbar />

        <main>
          <Hero />
          <Stats />
          <Features />
          <RadarShowcase />
          <Pricing />
          <CTA />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
