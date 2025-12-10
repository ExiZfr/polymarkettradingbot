"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Starter",
        price: "Free",
        period: "forever",
        description: "Perfect for trying out PolyGraalX",
        features: [
            "Paper trading only",
            "Basic market scanner",
            "Community support",
            "Limited to 10 trades/day",
        ],
        cta: "Start Free",
        popular: false,
    },
    {
        name: "Pro",
        price: "$49",
        period: "/month",
        description: "For serious traders",
        features: [
            "Real + Paper trading",
            "Advanced market scanner",
            "Copy trading (5 wallets)",
            "AI predictions",
            "Priority support",
            "Unlimited trades",
        ],
        cta: "Get Pro",
        popular: true,
    },
    {
        name: "Elite",
        price: "$99",
        period: "/month",
        description: "Maximum performance",
        features: [
            "Everything in Pro",
            "Copy trading (unlimited)",
            "Custom strategies",
            "API access",
            "Dedicated support",
            "White-label option",
        ],
        cta: "Go Elite",
        popular: false,
    },
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Choose the plan that fits your trading needs
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-8 rounded-2xl border ${plan.popular
                                    ? "border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-600/20 scale-105"
                                    : "border-gray-200 dark:border-gray-800"
                                } bg-white dark:bg-gray-950`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {plan.description}
                                </p>
                                <div className="flex items-end justify-center gap-1">
                                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                        {plan.price}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400 pb-2">
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <div className="mt-0.5 p-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            <Check size={14} className="text-green-600 dark:text-green-500" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/login"
                                className={`block w-full py-3 text-center font-medium rounded-xl transition-colors ${plan.popular
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
