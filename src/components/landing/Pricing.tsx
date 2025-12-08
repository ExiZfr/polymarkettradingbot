"use client";

import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Starter",
        icon: Zap,
        price: "Free",
        period: "",
        description: "Perfect for trying out the platform",
        features: [
            "Market Radar access",
            "5 trades per day",
            "Basic analytics",
            "Telegram alerts",
            "Community support",
        ],
        cta: "Get Started",
        href: "https://t.me/Plmktradingbot",
        popular: false,
    },
    {
        name: "Pro",
        icon: Crown,
        price: "$49",
        period: "/month",
        description: "For serious prediction market traders",
        features: [
            "Unlimited trades",
            "Copy trading feature",
            "Advanced sniping",
            "AI Oracle predictions",
            "Priority execution",
            "Priority support",
            "Custom alerts",
        ],
        cta: "Start Pro Trial",
        href: "https://t.me/Plmktradingbot",
        popular: true,
    },
    {
        name: "Elite",
        icon: Rocket,
        price: "$149",
        period: "/month",
        description: "Maximum performance for pros",
        features: [
            "Everything in Pro",
            "API access",
            "Custom strategies",
            "Direct dev support",
            "Early feature access",
            "White-glove onboarding",
            "Custom integrations",
        ],
        cta: "Contact Sales",
        href: "https://t.me/Plmktradingbot",
        popular: false,
    },
];

export default function Pricing() {
    return (
        <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                        <Crown size={14} className="text-yellow-400" />
                        <span className="text-sm font-medium text-slate-300">Simple Pricing</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Choose Your <span className="gradient-text">Plan</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Start free and scale as you grow. No hidden fees, cancel anytime.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className={`relative rounded-2xl p-6 sm:p-8 ${plan.popular
                                    ? "bg-gradient-to-b from-indigo-500/10 to-purple-500/5 border-2 border-indigo-500/30"
                                    : "glass"
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-xs font-bold text-white">
                                    Most Popular
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.popular ? "bg-indigo-500/20" : "bg-white/5"
                                }`}>
                                <plan.icon size={24} className={plan.popular ? "text-indigo-400" : "text-slate-400"} />
                            </div>

                            {/* Plan Info */}
                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                {plan.period && <span className="text-slate-500">{plan.period}</span>}
                            </div>
                            <p className="text-sm text-slate-400 mb-6">{plan.description}</p>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                                        <Check size={16} className="text-green-400 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link
                                href={plan.href}
                                target="_blank"
                                className={`block w-full py-3 text-center rounded-xl font-semibold transition-all ${plan.popular
                                        ? "bg-white text-black hover:bg-slate-100"
                                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
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
