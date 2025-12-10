"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
            <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl sm:text-5xl font-bold text-white mb-6"
                >
                    Ready to start trading smarter?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-blue-100 mb-10"
                >
                    Join thousands of traders using PolyGraalX to maximize their profits
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <Link
                        href="/login"
                        className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8"
                    >
                        Get Started Free
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
