"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Radar,
    Copy,
    BrainCircuit,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dash", href: "/dashboard", icon: LayoutDashboard },
    { name: "Radar", href: "/dashboard/radar", icon: Radar },
    { name: "Copy", href: "/dashboard/copy-trading", icon: Copy },
    { name: "Oracle", href: "/dashboard/oracle", icon: BrainCircuit },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 flex items-center justify-around px-2">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href} className="flex-1">
                        <div className="flex flex-col items-center justify-center gap-1 py-1">
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all",
                                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
                            )}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                                {item.name}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
