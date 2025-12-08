"use client";

import { motion } from "framer-motion";
import { Zap, Radar, Users, Power, Settings } from "lucide-react";
import Link from "next/link";

export type ModuleType = {
    id: number;
    name: string;
    description: string;
    icon: any;
    active: boolean;
    color: string;
    stats: { label: string; value: string }[];
};

export default function ActiveModules({ modules }: { modules: ModuleType[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {modules.map((module, index) => (
                <motion.div
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-[#0C0D12] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-white/5 ${module.color} group-hover:scale-110 transition-transform`}>
                                    <module.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{module.name}</h3>
                                    <p className="text-xs text-slate-500">{module.description}</p>
                                </div>
                            </div>
                            <div className={`relative w-10 h-6 rounded-full transition-colors ${module.active ? 'bg-green-500/20' : 'bg-white/5'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${module.active ? 'bg-green-500 translate-x-4' : 'bg-slate-500'
                                    }`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {module.stats.map((stat, i) => (
                                <div key={i} className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.02]">
                                    <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                                    <div className="text-sm font-mono font-medium text-white">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${module.active
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                }`}>
                                <Power size={16} />
                                {module.active ? 'Stop Module' : 'Start Module'}
                            </button>
                            <Link
                                href="/dashboard/settings"
                                className="p-2.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <Settings size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className={`h-1 w-full ${module.active ? 'bg-green-500' : 'bg-slate-700'}`} />
                </motion.div>
            ))}
        </div>
    );
}
