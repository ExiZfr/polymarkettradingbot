"use client"

import { redirect } from "next/navigation"

// Redirect root dashboard to Oracle (V1 production)
export default function DashboardPage() {
    redirect("/dashboard/oracle")
}
