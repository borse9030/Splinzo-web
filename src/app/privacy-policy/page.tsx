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
        "**Account Information:** When you create a Splinzo account, we collect your name, email address, profile picture (optional), and mobile number.",
        "**Expense & Group Data:** Information you provide about groups, expenses, splits, category tags, and optional receipt images.",
        "**Payment & Settlement Information:** When you use our automated UPI settlement feature, we collect your UPI ID (Virtual Payment Address / VPA) to enable direct peer-to-peer transfers. When a payment is executed, we also receive and store transaction verification metadata from our payment gateway, including the payment status, Setu Payment ID, transaction timestamp, and official Bank UTR (Unique Transaction Reference number).",
        "**Zero Storage of Sensitive Financial Credentials:** Splinzo NEVER collects, handles, or stores your UPI PIN, ATM PIN, bank account login credentials, OTPs, debit/credit card numbers, or CVVs. All payment authorizations and PIN entries occur exclusively within your own device's official UPI apps (such as Google Pay, PhonePe, Paytm, or BHIM).",
        "**Usage & Technical Data:** We collect information about how you interact with the app, device type, operating system version, and anonymous performance logs to maintain service reliability.",
        "**Customer Support:** When you reach out to our support team, we retain your messages and contact details to assist in resolving your query.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide, operate, and maintain the Splinzo expense-splitting platform.",
        "To generate automated dynamic UPI deeplinks and QR codes for seamless peer-to-peer debt settlements.",
        "To verify settlement finality using secure bank webhooks and automatically update group balances without manual interventions.",
        "To account for the transparent platform verification fee (₹1.00 per settlement) applied during checkout sessions.",
        "To sync your expense and settlement ledger in real-time across all your devices.",
        "To send essential notifications, including expense additions, settlement confirmations, and group invitations.",
        "To detect, prevent, and mitigate fraudulent activities or violations of our Terms of Service.",
        "We never sell, rent, or monetize your personal or financial data to third parties.",
      ],
    },
    {
      title: "3. Data Storage & Security",
      content: [
        "**Cloud Infrastructure:** Your account and expense data is stored securely using Google Firebase, adhering to industry-leading SOC 1/2/3 and ISO 27001 security standards.",
        "**End-to-End Encryption:** All data transmissions between your device, our servers, and payment infrastructure are encrypted using HTTPS and modern TLS protocols.",
        "**Cryptographic Verification:** All incoming payment status notifications (webhooks) are cryptographically validated to ensure authenticity before any balance is settled.",
        "**Strict Access Controls:** Internal access to user data is strictly restricted to authorized personnel on a least-privilege basis.",
        "**No Banking Credentials Stored:** As stated, we never hold bank login details or UPI PINs.",
      ],
    },
    {
      title: "4. Data Sharing & Third-Party Service Providers",
      content: [
        "**Group Members:** Expense logs, split calculations, and settlement status (including your registered UPI ID and payment confirmation status) are visible to members of the specific group you belong to.",
        "**Payment Infrastructure Partners:** We integrate with Setu (Pine Labs entity), an authorized payment infrastructure provider, to generate UPI deeplinks and receive automated payment confirmations. Only transaction-essential metadata (payee UPI ID, amount, and reference identifier) is exchanged with Setu in strict accordance with RBI and NPCI standards.",
        "**Cloud & Database Providers:** We use Google Firebase for authentication, database storage, and cloud infrastructure.",
        "**Legal Compliance:** We may disclose information if required by applicable Indian laws, judicial proceedings, or lawful requests from regulatory authorities.",
        "**Advertising:** We may use Google AdSense on informational web pages. Third-party advertising vendors use cookies to serve ads based on prior web visits. Financial and settlement data is never shared with advertisers.",
      ],
    },
    {
      title: "5. Your Rights & Data Control",
      content: [
        "**Access & Transparency:** You can review all your logged expenses, settlements, and linked UPI IDs within the app at any time.",
        "**Correction & Updating:** You can update your profile name, email, and registered UPI ID directly through account settings.",
        "**Account Deletion:** You have the right to delete your Splinzo account at any time via Profile Settings or by emailing privacy@splinzo.app. Upon account deletion, personal identifiers are permanently deleted within 30 days.",
        "**Data Portability:** You can export your expense summaries and group settlement histories.",
      ],
    },
    {
      title: "6. Cookies & Tracking Technologies",
      content: [
        "The Splinzo web platform utilizes cookies and local storage to maintain your authentication session, preferences, and security state.",
        "Third-party partners, including Google, may use cookies to serve relevant contextual ads on public web pages.",
        "You can manage cookie preferences through your browser settings, though disabling essential cookies may impact web app authentication.",
      ],
    },
    {
      title: "7. Children's Privacy",
      content: [
        "Splinzo is not designed for or directed at children under the age of 18 (or 13 where permitted by local law with parental consent).",
        "We do not knowingly collect personal or financial information from minors.",
        "If you believe a minor has provided us with personal information without parental consent, please contact us immediately for deletion.",
      ],
    },
    {
      title: "8. Changes to This Privacy Policy",
      content: [
        "We may revise this Privacy Policy periodically to reflect changes in our automated payment features, legal frameworks, or service enhancements.",
        "Whenever material changes occur, we will update the 'Last Updated' date and notify users through app or website banners.",
        "Your continued use of Splinzo following any updates constitutes agreement to the modified policy.",
      ],
    },
    {
      title: "9. Contact & Grievance Redressal",
      content: [
        "For any questions, concerns, or grievances regarding this Privacy Policy or your data privacy, please contact our team:",
        "**Email:** privacy@splinzo.app",
        "**Official Website:** https://www.splinzo.in/contact",
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
            Last Updated: September 2025
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
            <Link href="/about" className="hover:text-gray-700 transition-colors">About Us</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
