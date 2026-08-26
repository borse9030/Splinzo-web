import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Splinzo",
  description: "Learn more about Splinzo, our mission, and the team building the best expense-sharing app.",
};

export default function About() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Splinzo" width={32} height={32} className="rounded-xl shadow-sm" />
            <span className="text-lg font-black text-gray-900">Splinzo</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="py-16 px-5 text-center"
           style={{ background: "linear-gradient(180deg, #FFF9E6 0%, #FFFFFF 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">About Splinzo</h1>
          <p className="text-gray-500 text-lg">
            We're on a mission to remove the financial friction from friendships.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-14">
        <div className="flex flex-col gap-10">
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Splinzo was born out of a common frustration: living with roommates and taking group trips is amazing, but dealing with the shared expenses at the end is a nightmare. Spreadsheets get messy, group chats become filled with IOUs, and someone always ends up paying more than their fair share.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We decided to build a platform that doesn't just track expenses, but intelligently calculates the fastest and easiest way for everyone to get paid back. Our goal is to ensure that you can focus on making memories, not doing math.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <div className="p-6 rounded-2xl" style={{ background: "#FFF8E1", border: "1px solid #F9B91230" }}>
              <p className="text-gray-800 text-lg font-medium leading-relaxed italic">
                "To create a world where sharing expenses with friends, family, and colleagues is completely seamless, transparent, and stress-free."
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Splinzo?</h2>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-gray-600 text-base leading-relaxed">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: "#F9B912" }} />
                <span><strong>Simplicity:</strong> We believe financial tools should be intuitive and require zero learning curve.</span>
              </li>
              <li className="flex gap-3 text-gray-600 text-base leading-relaxed">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: "#F9B912" }} />
                <span><strong>Transparency:</strong> Everyone in a group sees exactly what was spent, by whom, and for what. No hidden calculations.</span>
              </li>
              <li className="flex gap-3 text-gray-600 text-base leading-relaxed">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: "#F9B912" }} />
                <span><strong>Privacy First:</strong> We treat your financial data with the utmost respect. We employ bank-grade security and never sell your personal information.</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-14 p-8 rounded-2xl text-center border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Get in Touch</h2>
          <p className="text-gray-600 mb-6">
            We are always looking for feedback to make Splinzo better. Whether you have a feature request, a bug report, or just want to chat.
          </p>
          <Link href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-md"
                style={{ background: "#F9B912", color: "#1a1a1a" }}>
            Contact the Team
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Splinzo. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-gray-700 transition-colors">About Us</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
