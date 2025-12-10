"use client";

import { motion } from "framer-motion";

const stats = [
    { value: "$2.5M+", label: "Total Volume Traded" },
    { value: "12,500+", label: "Active Traders" },
    { value: "45,000+", label: "Trades Executed" },
    { value: "99.9%", label: "System Uptime" },
];

export default function Stats() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center"
                        >
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
