"use client";

import { motion } from "framer-motion";
import {
    Radar,
    Users,
    Brain,
    Zap,
    Shield,
    TrendingUp,
} from "lucide-react";

const features = [
    {
        icon: Radar,
        title: "Market Scanner",
        description:
            "Real-time market scanning with AI-powered opportunity detection",
        color: "blue",
    },
    {
        icon: Zap,
        title: "Instant Execution",
        description:
            "Lightning-fast trade execution with <50ms latency",
        color: "yellow",
    },
    {
        icon: Users,
        title: "Copy Trading",
        description:
            "Follow top traders automatically and mirror their strategies",
        color: "purple",
    },
    {
        icon: Brain,
        title: "AI Predictions",
        description:
            "Machine learning models analyzing market trends and signals",
        color: "pink",
    },
    {
        icon: Shield,
        title: "Paper Trading",
        description:
            "Test your strategies risk-free with simulated trading",
        color: "green",
    },
    {
        icon: TrendingUp,
        title: "Analytics",
        description:
            "Comprehensive performance tracking and advanced analytics",
        color: "indigo",
    },
];

const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-500",
    yellow: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900 text-yellow-600 dark:text-yellow-500",
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-500",
    pink: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-500",
    green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-600 dark:text-green-500",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-500",
};

export default function Features() {
    return (
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/50">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                        Everything you need to trade
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Powerful features designed to give you an edge in prediction markets
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all cursor-pointer"
                        >
                            <div
                                className={`inline-flex p-3 rounded-xl border mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}
                            >
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
