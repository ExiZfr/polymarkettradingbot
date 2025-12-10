"use client";

import { motion } from "framer-motion";
import { Radar } from "lucide-react";

export default function RadarShowcase() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Content */}
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            Real-time market intelligence
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                            Our AI-powered scanner monitors thousands of markets 24/7, identifying high-probability opportunities before the crowd.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Instant market alerts",
                                "Smart opportunity scoring",
                                "Historical trend analysis",
                                "Custom signal filters",
                            ].map((feature, i) => (
                                <motion.li
                                    key={feature}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                                >
                                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                        <Radar size={16} className="text-blue-600 dark:text-blue-500" />
                                    </div>
                                    {feature}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative">
                        <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
                            <Radar size={120} className="text-blue-600/20 dark:text-blue-500/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
