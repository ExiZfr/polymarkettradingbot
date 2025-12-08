"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { TrendingUp, Users, Zap, Trophy } from "lucide-react";

const stats = [
    {
        icon: TrendingUp,
        value: 2847500,
        prefix: "$",
        suffix: "",
        label: "Total Volume",
        color: "text-green-400",
    },
    {
        icon: Users,
        value: 1247,
        prefix: "",
        suffix: "+",
        label: "Active Traders",
        color: "text-blue-400",
    },
    {
        icon: Trophy,
        value: 87,
        prefix: "",
        suffix: "%",
        label: "Win Rate",
        color: "text-yellow-400",
    },
    {
        icon: Zap,
        value: 15420,
        prefix: "",
        suffix: "",
        label: "Trades Executed",
        color: "text-purple-400",
    },
];

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            const duration = 2000;
            const steps = 60;
            const stepDuration = duration / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += value / steps;
                if (current >= value) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(current));
                }
            }, stepDuration);

            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
        }
        return num.toLocaleString();
    };

    return (
        <span ref={ref}>
            {prefix}{formatNumber(displayValue)}{suffix}
        </span>
    );
}

export default function Stats() {
    return (
        <section className="relative py-16 sm:py-20 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl hover:bg-white/[0.02] transition-colors">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>

                                {/* Value */}
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                                    <AnimatedNumber
                                        value={stat.value}
                                        prefix={stat.prefix}
                                        suffix={stat.suffix}
                                    />
                                </div>

                                {/* Label */}
                                <div className="text-sm sm:text-base text-slate-500">
                                    {stat.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
