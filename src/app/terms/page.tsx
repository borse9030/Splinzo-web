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
        "Splinzo is an automated expense-splitting and group finance management platform available on the web and Android.",
        "The service allows users to create groups, log shared expenses, calculate individual debt obligations, and execute automated peer-to-peer UPI settlements.",
        "Splinzo provides automated payment link generation and bank confirmation tracking in partnership with regulated fintech and payment gateway infrastructure (including Setu / NPCI UPI Deeplinks).",
        "We reserve the right to modify, suspend, or discontinue any part of the service at any time.",
      ],
    },
    {
      title: "3. User Accounts",
      content: [
        "You must create an account to use most features of Splinzo.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You must provide accurate and complete information, including a valid name and UPI ID, when creating your account.",
        "You may not create accounts for the purpose of abuse, harassment, or fraudulent activity.",
        "You are solely responsible for all activity that occurs under your account.",
      ],
    },
    {
      title: "4. Acceptable Use",
      content: [
        "You agree to use Splinzo only for lawful purposes and in accordance with these terms.",
        "You may not use Splinzo to engage in money laundering, fraudulent financial activities, or unauthorized commercial transactions.",
        "You may not attempt to manipulate, bypass, or reverse engineer our automated settlement or verification systems.",
        "You may not attempt to gain unauthorized access to other users' accounts, data, or payment links.",
        "Violation of these terms may result in immediate account suspension and termination.",
      ],
    },
    {
      title: "5. Content & Data",
      content: [
        "You retain ownership of all expense data and receipt images you add to Splinzo.",
        "By using Splinzo, you grant us a limited license to store, process, and display your expense content and transaction metadata to provide the service.",
        "You are responsible for the accuracy of all expense entries, amounts, and split configurations.",
        "Splinzo is not liable for disputes arising from erroneous expense entries or member miscommunications.",
      ],
    },
    {
      title: "6. Automated UPI Settlements & Payments",
      content: [
        "Direct Bank-to-Bank Transfers: All settlements facilitated by Splinzo occur directly between the paying user's bank account and the receiving user's bank account via the NPCI Unified Payments Interface (UPI).",
        "No Custody or Escrow: Splinzo is not a bank, non-banking financial company (NBFC), digital wallet, or escrow agent. Splinzo does not hold, store, or escrow user funds at any point.",
        "Regulated Gateway Integration: UPI payment links and dynamic QR codes are generated through authorized payment infrastructure providers (Setu / Pine Labs). Transactions are authenticated natively inside your chosen UPI application (such as Google Pay, PhonePe, Paytm, or BHIM).",
        "Platform Verification Fee: To maintain our automated instant bank confirmation, webhook infrastructure, and real-time ledger synchronization, Splinzo charges a transparent platform fee of ₹1.00 (or as displayed in the payment breakdown card) per settlement session. This fee is added to the base payable amount upon checkout.",
        "User Accuracy Responsibility: Users are strictly responsible for providing an accurate and active UPI Virtual Payment Address (VPA / UPI ID) in their profile to receive funds. Splinzo bears no responsibility or liability for payments routed to an incorrect UPI ID provided by a group member.",
        "Automated Settlement Finality: A settlement is marked as 'Approved' and synchronized across group balances only upon receipt of official bank confirmation (Bank Unique Transaction Reference - UTR). Manual payment overrides are disabled to ensure ledger integrity.",
      ],
    },
    {
      title: "7. Refunds, Cancellations & Failed Transactions",
      content: [
        "Failed UPI Transactions: If money is debited from your bank account but the settlement fails to confirm or complete, the funds will be automatically reversed to your source bank account by your issuing bank in accordance with standard NPCI guidelines (typically within T+1 to T+3 business days).",
        "Platform Fee Policy: The ₹1.00 platform verification fee covers the generation, security, and verification infrastructure of the payment session. Once the secure payment session is initiated and executed, the platform fee is non-refundable.",
        "Peer-to-Peer Disputes: Because settlements are direct transfers between individual users' bank accounts, Splinzo cannot reverse, recall, or refund completed peer-to-peer transfers. Any disputes regarding split shares or reimbursement amounts must be settled directly between the involved group members.",
      ],
    },
    {
      title: "8. Group Administration",
      content: [
        "Group administrators are responsible for managing member invitations and group participation.",
        "All members within a group have visibility into all shared expenses and settlement records logged in that group.",
        "Splinzo does not act as an arbitrator for personal financial disagreements between group members.",
      ],
    },
    {
      title: "9. Intellectual Property",
      content: [
        "The Splinzo brand, logo, application interfaces, and proprietary software are the exclusive intellectual property of Splinzo.",
        "You may not copy, reproduce, distribute, or create derivative works from any part of our service without prior written authorization.",
      ],
    },
    {
      title: "10. Disclaimers & Limitation of Liability",
      content: [
        "Splinzo is provided on an 'as is' and 'as available' basis without warranties of any kind.",
        "We do not guarantee uninterrupted banking gateway availability or error-free network communications across third-party UPI applications and banking servers.",
        "Splinzo is not liable for indirect, incidental, or consequential damages resulting from banking delays, NPCI network outages, or user negligence.",
        "To the fullest extent permitted by applicable law, our aggregate liability for any claim shall not exceed the platform fees paid by you to Splinzo in the preceding twelve (12) months.",
      ],
    },
    {
      title: "11. Account Termination",
      content: [
        "You may delete your account at any time through the profile settings in the web or mobile app.",
        "We reserve the right to suspend or terminate accounts that engage in fraudulent activity, violate acceptable use rules, or compromise system security.",
        "Upon account deletion, your personal information is purged within 30 days, while non-identifiable shared group transaction logs remain intact to preserve group ledger consistency.",
      ],
    },
    {
      title: "12. Changes to Terms",
      content: [
        "We may update these Terms of Service periodically to reflect product evolutions or regulatory requirements.",
        "Notice of material revisions will be provided through in-app notifications or website notices.",
        "Your continued use of Splinzo following posted updates constitutes acceptance of the modified terms.",
      ],
    },
    {
      title: "13. Governing Law & Jurisdiction",
      content: [
        "These terms shall be governed by and construed in accordance with the laws of India.",
        "Any legal disputes arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in India.",
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
            <Link href="/about" className="hover:text-gray-700 transition-colors">About Us</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
