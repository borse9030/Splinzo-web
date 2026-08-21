import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Splinzo",
  description: "Read Splinzo's Privacy Policy to understand how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "**Account Information:** When you create a Splinzo account, we collect your name, email address, and profile picture (optional).",
        "**Usage Data:** We collect information about how you use the app — expenses created, groups joined, features used — to improve our service.",
        "**Device Information:** We may collect device type, operating system version, and app version to provide technical support.",
        "**Communications:** When you contact us for support, we retain those messages to assist you and improve our service.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide, operate, and maintain the Splinzo service.",
        "To sync your expense data across devices in real-time.",
        "To send you important notifications (expense reminders, group invitations).",
        "To respond to your customer support inquiries.",
        "To analyse usage patterns and improve app functionality.",
        "We never sell your personal data to third parties.",
      ],
    },
    {
      title: "3. Data Storage & Security",
      content: [
        "Your data is stored securely using Google Firebase, which is compliant with industry-standard security practices.",
        "All data transmissions are encrypted using HTTPS/TLS.",
        "We implement access controls to ensure only authorised personnel can access your data.",
        "We do not store payment credentials or banking information.",
      ],
    },
    {
      title: "4. Data Sharing",
      content: [
        "**Group Members:** Expense data you add to a group is visible to all members of that group.",
        "**Service Providers:** We use Firebase (Google) for authentication and database services. They are bound by their own privacy policies.",
        "**Legal Requirements:** We may disclose information if required by law, court order, or to protect the rights of Splinzo and its users.",
        "**Advertising:** We use Google AdSense to serve ads. Third-party vendors may use cookies to serve personalized ads based on your visit to our site.",
      ],
    },
    {
      title: "5. Your Rights",
      content: [
        "**Access:** You can view all your data within the Splinzo app at any time.",
        "**Correction:** You can update your profile information in account settings.",
        "**Deletion:** You can request deletion of your account and all associated data by contacting us at privacy@splinzo.app.",
        "**Portability:** You can export your expense data via the app's export feature.",
      ],
    },
    {
      title: "6. Cookies & Tracking",
      content: [
        "The Splinzo web app uses cookies to maintain your login session and store user preferences.",
        "**Third-party vendors, including Google**, use cookies to serve ads based on your prior visits to our website or other websites.",
        "Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to Splinzo and/or other sites on the Internet.",
        "You may opt out of personalized advertising by visiting **Ads Settings** (https://www.google.com/settings/ads).",
        "You can also disable cookies in your browser, but this may affect app functionality.",
      ],
    },
    {
      title: "7. Children's Privacy",
      content: [
        "Splinzo is not directed at children under the age of 13.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware that a child under 13 has provided us with personal information, we will promptly delete it.",
      ],
    },
    {
      title: "8. Changes to This Policy",
      content: [
        "We may update this Privacy Policy periodically. When we do, we will notify you via the app or email.",
        "Your continued use of Splinzo after the changes take effect constitutes acceptance of the updated policy.",
        "The 'Last Updated' date at the top of this policy indicates when it was last revised.",
      ],
    },
    {
      title: "9. Contact Us",
      content: [
        "If you have any questions about this Privacy Policy or how we handle your data, please contact us:",
        "Email: privacy@splinzo.app",
        "You can also use our Contact page to send us a message directly.",
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
            Last Updated: August 2025
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-lg">
            We take your privacy seriously. Here&apos;s exactly how we handle your data —
            clearly and without legal jargon.
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
                    <span dangerouslySetInnerHTML={{
                      __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 p-6 rounded-2xl text-center"
             style={{ background: "#FFF8E1", border: "1px solid #F9B91230" }}>
          <p className="text-gray-700 font-medium mb-3">Have questions about your privacy?</p>
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
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
