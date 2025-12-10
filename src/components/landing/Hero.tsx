"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, TrendingUp, Shield } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-900/50"
        >
          <Trophy size={14} />
          <span>The #1 Trading Bot for Prediction Markets</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6"
        >
          Predict. Trade. <br className="hidden sm:block" />
          <span className="text-blue-600 dark:text-blue-500">Win Automatically.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Automated algorithmic trading for Polymarket.
          Use AI to detect opportunities and execute trades in milliseconds.
          <br />
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2 block">
            Currently in Paper Trading Mode (Beta)
          </span>
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            Start Paper Trading
            <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            View Features
          </a>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm text-gray-500 dark:text-gray-400 font-medium"
        >
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-green-500" />
            <span>Risk-Free Paper Trading</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            <span>Real-time Market Data</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
