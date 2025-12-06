"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OracleBall } from "@/components/oracle/OracleBall";

export default function OraclePage() {
    return (
        <AppLayout>
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-10">
                <div className="text-center mb-12 space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                        The Oracle
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        AI-powered contrarian analysis engine. Detecting market anomalies and reversal patterns.
                    </p>
                </div>

                <OracleBall />
            </div>
        </AppLayout>
    );
}
