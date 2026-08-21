import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Splinzo",
  description: "Read Splinzo's Terms of Service to understand the rules and guidelines for using our expense splitting platform.",
};

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing or using the Splinzo application (web or mobile), you agree to be bound by these Terms of Service.",
        "If you do not agree to these terms, please do not use our service.",
        "These terms apply to all users, including guests, registered users, and group administrators.",
      ],
    },
    {
      title: "2. Description of Service",
      content: [
        "Splinzo is an expense-splitting and group finance management platform.",
        "The service allows users to create groups, log shared expenses, calculate individual shares, and track settlements.",
        "Splinzo is available via web browser and Android mobile application.",
        "We reserve the right to modify, suspend, or discontinue any part of the service at any time.",
      ],
    },
    {
      title: "3. User Accounts",
      content: [
        "You must create an account to use most features of Splinzo.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You must provide accurate and complete information when creating your account.",
        "You may not create accounts for the purpose of abuse, harassment, or fraudulent activity.",
        "You are solely responsible for all activity that occurs under your account.",
      ],
    },
    {
      title: "4. Acceptable Use",
      content: [
        "You agree to use Splinzo only for lawful purposes and in accordance with these terms.",
        "You may not use Splinzo to harass, intimidate, or harm other users.",
        "You may not attempt to gain unauthorized access to other users' accounts or data.",
        "You may not use Splinzo to engage in any fraudulent financial activity.",
        "You may not reverse engineer, decompile, or attempt to extract the source code of our apps.",
        "Violation of these terms may result in immediate account termination.",
      ],
    },
    {
      title: "5. Content & Data",
      content: [
        "You retain ownership of all expense data and content you add to Splinzo.",
        "By using Splinzo, you grant us a limited license to store, process, and display your content to provide the service.",
        "You are responsible for the accuracy of expenses and financial data you enter.",
        "We are not responsible for any disputes arising from incorrect or disputed expense entries.",
      ],
    },
    {
      title: "6. Group Responsibility",
      content: [
        "When you create a group, you become the group administrator.",
        "As a group admin, you are responsible for managing member access and group content.",
        "All group members can view all expenses added to the group.",
        "Splinzo does not mediate financial disputes between group members.",
        "Splinzo is a tracking tool — we do not facilitate actual money transfers.",
      ],
    },
    {
      title: "7. Intellectual Property",
      content: [
        "The Splinzo name, logo, and all related marks are trademarks of Splinzo.",
        "The app's design, code, and features are the intellectual property of Splinzo's creators.",
        "You may not copy, reproduce, or distribute any part of the Splinzo service without written permission.",
      ],
    },
    {
      title: "8. Disclaimers & Limitation of Liability",
      content: [
        "Splinzo is provided 'as is' without warranties of any kind, express or implied.",
        "We do not guarantee that the service will be uninterrupted, error-free, or completely secure.",
        "Splinzo is not responsible for any financial losses arising from the use of our service.",
        "Our liability to you for any claim is limited to the amount you paid us in the past 12 months (which, for free users, is $0).",
      ],
    },
    {
      title: "9. Account Termination",
      content: [
        "You may delete your account at any time via the account settings in the app.",
        "We reserve the right to suspend or terminate accounts that violate these terms.",
        "Upon account deletion, your data will be permanently deleted within 30 days.",
        "Data shared with group members (expenses you added) may remain visible to those members.",
      ],
    },
    {
      title: "10. Changes to Terms",
      content: [
        "We may update these Terms of Service periodically.",
        "We will notify you of significant changes via email or in-app notification.",
        "Continued use of Splinzo after changes are posted constitutes acceptance of the new terms.",
      ],
    },
    {
      title: "11. Governing Law",
      content: [
        "These terms are governed by the laws of India.",
        "Any disputes arising from these terms shall be resolved in the courts of India.",
        "If any provision of these terms is found to be unenforceable, the remaining provisions remain in effect.",
      ],
    },
  ];

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
               style={{ background: "#FFF3CD", color: "#B8860B" }}>
            Effective: August 2025
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-lg">
            Please read these terms carefully before using Splinzo.
            By using our service, you agree to these terms.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-14">
        <div className="flex flex-col gap-10">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                {sec.title}
              </h2>
              <ul className="flex flex-col gap-3">
                {sec.content.map((item) => (
                  <li key={item} className="flex gap-3 text-gray-600 text-base leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#F9B912" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 p-6 rounded-2xl text-center"
             style={{ background: "#FFF8E1", border: "1px solid #F9B91230" }}>
          <p className="text-gray-700 font-medium mb-3">Questions about our Terms?</p>
          <Link href="/contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105"
                style={{ background: "#F9B912", color: "#1a1a1a" }}>
            Contact Us
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Splinzo. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
