export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar would go here */}
            <aside className="w-64 border-r border-zinc-800 p-4">
                Sidebar
            </aside>
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    )
}
