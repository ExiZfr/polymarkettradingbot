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
                    className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-sm"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-900 ${module.color} group-hover:scale-110 transition-transform`}>
                                    <module.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{module.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{module.description}</p>
                                </div>
                            </div>
                            <div className={`relative w-10 h-6 rounded-full transition-colors ${module.active ? 'bg-green-500/20' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${module.active ? 'bg-green-500 translate-x-4' : 'bg-gray-400 dark:bg-gray-600'
                                    }`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {module.stats.map((stat, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
                                    <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${module.active
                                ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20'
                                : 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                                }`}>
                                <Power size={16} />
                                {module.active ? 'Stop Module' : 'Start Module'}
                            </button>
                            <Link
                                href="/dashboard/settings"
                                className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Settings size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className={`h-1 w-full ${module.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                </motion.div>
            ))}
        </div>
    );
}
