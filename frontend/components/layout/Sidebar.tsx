"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Radar,
    Copy,
    BrainCircuit,
    Settings,
    LogOut,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Radar", href: "/dashboard/radar", icon: Radar },
    { name: "Copy Trading", href: "/dashboard/copy-trading", icon: Copy },
    { name: "Oracle", href: "/dashboard/oracle", icon: BrainCircuit },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex flex-col w-64 h-screen border-r border-border/50 bg-background/50 backdrop-blur-xl fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                    <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">PolySniper</h1>
                    <p className="text-xs text-muted-foreground">v1.0.0 Beta</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive && "fill-current opacity-50")} />
                                <span className="font-medium">{item.name}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/50">
                <div className="bg-secondary/30 rounded-xl p-4 mb-4 border border-white/5">
                    <div className="text-xs font-mono text-muted-foreground mb-1">Wallet Balance</div>
                    <div className="text-xl font-bold text-foreground">$12,450.00</div>
                    <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +2.4% today
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
