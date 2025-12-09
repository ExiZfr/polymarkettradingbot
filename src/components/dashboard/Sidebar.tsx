"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Radar,
    Users,
    Brain,
    Settings,
    LogOut,
    Zap,
    ChevronRight,
    Receipt,
    Radio,
    ChevronDown,
    Plus,
    Trash2,
    Check,
    Loader2
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import ProfileModal from "./ProfileModal";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
};

interface Profile {
    id: string;
    name: string;
    balance: number;
}

const navItems: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Market Radar", href: "/dashboard/radar", icon: Radar, badge: "Live" },
    { label: "Listener", href: "/dashboard/listener", icon: Radio },
    { label: "Orders", href: "/dashboard/orders", icon: Receipt },
    { label: "Copy Trading", href: "/dashboard/copy-trading", icon: Users },
    { label: "Oracle", href: "/dashboard/oracle", icon: Brain },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({
    isSidebarOpen,
    setSidebarOpen
}: {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}) {
    const pathname = usePathname();
    const { wallet, refreshWallet } = useWallet();

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('default');
    const [activeProfileName, setActiveProfileName] = useState<string>('Main Account');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

    // Fetch Profiles
    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setIsLoadingProfiles(true);
        try {
            const res = await fetch('/api/paper/profiles');
            if (res.ok) {
                const data = await res.json();
                // NULL SAFETY: Check if data and profiles exist
                if (data && data.profiles) {
                    setActiveProfileId(data.activeProfileId || 'default');
                    const profileList = Object.values(data.profiles) as Profile[];
                    setProfiles(profileList);
                    const activeProfile = profileList.find(p => p.id === (data.activeProfileId || 'default'));
                    if (activeProfile) {
                        setActiveProfileName(activeProfile.name);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch profiles", e);
        } finally {
            setIsLoadingProfiles(false);
        }
    };

    const handleSwitchProfile = async (profileId: string) => {
        try {
            const res = await fetch('/api/paper/profiles/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId })
            });
            if (res.ok) {
                setActiveProfileId(profileId);
                const profile = profiles.find(p => p.id === profileId);
                if (profile) setActiveProfileName(profile.name);
                setIsProfileMenuOpen(false);
                refreshWallet();
            }
        } catch (e) {
            console.error("Failed to switch profile", e);
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (profileId === 'default') return;
        if (!confirm(`Delete profile? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/paper/profiles/${profileId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchProfiles();
                if (activeProfileId === profileId) {
                    handleSwitchProfile('default');
                }
            }
        } catch (e) {
            console.error("Failed to delete profile", e);
        }
    };

    const handleCreateProfile = async (profileData: { name: string; balance: number; settings: any }) => {
        try {
            const res = await fetch('/api/paper/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (res.ok) {
                const newProfile = await res.json();
                setIsProfileModalOpen(false);
                fetchProfiles();
                handleSwitchProfile(newProfile.id);
            }
        } catch (e) {
            console.error("Failed to create profile", e);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <>
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0A0B10] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                <div className="h-20 flex items-center px-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">
                            Poly<span className="text-indigo-400">GraalX</span>
                        </span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white transition-colors"} />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 rounded-full animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                                {isActive && <ChevronRight size={16} className="text-indigo-400" />}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/5 bg-[#0C0D12]">
                    <div className="relative">
                        {isLoadingProfiles ? (
                            <div className="w-full bg-white/5 rounded-xl p-4 mb-4 border border-white/5 flex items-center justify-center gap-2 text-slate-400">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs">Loading...</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="w-full bg-white/5 rounded-xl p-4 mb-4 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                                        {getInitials(activeProfileName)}
                                    </div>
                                    <div className="overflow-hidden flex-1 text-left">
                                        <div className="text-sm font-bold text-white truncate">{activeProfileName}</div>
                                        <div className="text-xs text-slate-400 truncate">Paper Trading</div>
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400 bg-black/20 rounded-lg p-2">
                                    <span>Balance</span>
                                    <span className="font-mono text-green-400">
                                        ${wallet ? wallet.balance.toFixed(2) : '---'}
                                    </span>
                                </div>
                            </button>
                        )}

                        <AnimatePresence>
                            {isProfileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#0C0D12] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                                >
                                    <div className="max-h-48 overflow-y-auto">
                                        {profiles.map(profile => (
                                            <div
                                                key={profile.id}
                                                className="flex items-center justify-between px-3 py-2 hover:bg-white/5 cursor-pointer group"
                                            >
                                                <button
                                                    onClick={() => handleSwitchProfile(profile.id)}
                                                    className="flex items-center gap-2 flex-1 text-left"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                                        {getInitials(profile.name)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-white">{profile.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">${profile.balance.toFixed(0)}</div>
                                                    </div>
                                                    {profile.id === activeProfileId && (
                                                        <Check size={14} className="text-green-400 ml-auto" />
                                                    )}
                                                </button>
                                                {profile.id !== 'default' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                                                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-white/5 p-2">
                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); setIsProfileModalOpen(true); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        >
                                            <Plus size={16} />
                                            Create New Profile
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={async () => {
                            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                            window.location.href = '/';
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </motion.aside>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleCreateProfile}
            />
        </>
    );
}
