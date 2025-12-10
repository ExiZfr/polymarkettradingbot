"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export default function Footer() {
    const links = {
        product: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
        ],
        company: [
            { label: "About", href: "/about" },
        ],
        legal: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Cookies", href: "/cookies" },
        ],
    };

    return (
        <footer className="bg-background border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">P</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">
                                Poly<span className="text-primary">GraalX</span>
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            AI-powered trading bot for Polymarket prediction markets.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://twitter.com"
                                className="p-2 bg-secondary rounded-lg hover:bg-muted transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Twitter size={18} className="text-foreground" />
                            </a>
                            <a
                                href="https://github.com"
                                className="p-2 bg-secondary rounded-lg hover:bg-muted transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github size={18} className="text-foreground" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-2">
                            {links.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Company</h3>
                        <ul className="space-y-2">
                            {links.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                        <ul className="space-y-2">
                            {links.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-border">
                    <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} PolyGraalX. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
