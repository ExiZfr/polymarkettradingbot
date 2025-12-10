import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
            <Navbar />
            <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Cookie Policy</h1>
                <div className="prose dark:prose-invert prose-lg max-w-none">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Last updated: December 10, 2024</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">What Are Cookies</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How We Use Cookies</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            We use cookies to maintain your session and remember your preferences, such as your selected theme (dark/light mode).
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
