import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Zap, Shield, Users, Globe } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                        About <span className="text-blue-600 dark:text-blue-500">PolyGraalX</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        We are on a mission to democratize algorithmic trading for prediction markets.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Mission</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                            PolyGraalX was founded with a simple belief: that the power of prediction markets should be accessible to everyone, not just institutional players with high-frequency trading algorithms.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                            We combine cutting-edge AI with real-time data analysis to provide traders with the tools they need to make informed decisions and automate their strategies on Polymarket.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <Zap className="text-blue-600 dark:text-blue-500 mb-4" size={32} />
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Speed</h3>
                            <p className="text-gray-600 dark:text-gray-500">Microsecond execution latency</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <Shield className="text-green-600 dark:text-green-500 mb-4" size={32} />
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Security</h3>
                            <p className="text-gray-600 dark:text-gray-500">Enterprise-grade protection</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <Users className="text-purple-600 dark:text-purple-500 mb-4" size={32} />
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Community</h3>
                            <p className="text-gray-600 dark:text-gray-500">Thousands of active traders</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <Globe className="text-blue-600 dark:text-blue-500 mb-4" size={32} />
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Global</h3>
                            <p className="text-gray-600 dark:text-gray-500">Markets from around the world</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">Our Values</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Transparency</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                We believe in open source principles and clear communication about how our algorithms work.
                            </p>
                        </div>
                        <div className="p-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Innovation</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                We constantly push the boundaries of what's possible in DeFi and prediction markets.
                            </p>
                        </div>
                        <div className="p-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">User First</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Every feature we build is designed to solve real problems for our community of traders.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
