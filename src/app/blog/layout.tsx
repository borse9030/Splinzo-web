import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog & Resources | Splinzo",
  description: "Read the latest tips, guides, and resources on managing group expenses, traveling with friends, and splitting bills effortlessly.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Blog Sticky Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Splinzo" width={32} height={32} className="rounded-xl shadow-sm" />
            <span className="text-lg font-black text-gray-900">Splinzo</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              ← Back to Home
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-bold transition-transform hover:scale-105 shadow-sm"
              style={{ background: "#F9B912", color: "#1a1a1a" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-5 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Splinzo. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-gray-700 transition-colors">About Us</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
