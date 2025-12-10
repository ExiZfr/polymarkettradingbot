import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
            <Navbar />
            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Terms of Service</h1>
                <div className="prose dark:prose-invert prose-lg max-w-none">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Last updated: December 10, 2024</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            By accessing and using PolyGraalX, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Use License</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Permission is granted to temporarily use PolyGraalX for personal, non-commercial transitory viewing only.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Disclaimer</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Trading involves risk. PolyGraalX is provided "as is" without warranty of any kind. Use at your own risk.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
