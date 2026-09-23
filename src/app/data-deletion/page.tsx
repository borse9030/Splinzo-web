import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Data Deletion Policy & Instructions | Splinzo",
  description:
    "Learn how to request deletion of your Splinzo account, personal data, and transaction records in compliance with Google Play Developer Policies.",
  alternates: {
    canonical: "/data-deletion",
  },
  openGraph: {
    title: "Account & Data Deletion | Splinzo",
    description: "Step-by-step guide to delete your Splinzo account and associated data.",
    url: "/data-deletion",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Splinzo Data Deletion" }],
  },
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Splinzo" width={32} height={32} className="rounded-xl shadow-sm" />
            <span className="text-lg font-black text-gray-900">Splinzo</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div
        className="py-16 px-5 text-center"
        style={{ background: "linear-gradient(180deg, #FFF9E6 0%, #FFFFFF 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
            style={{ background: "#FFF3CD", color: "#B8860B" }}
          >
            Google Play Data Safety & User Rights Compliance
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Account & Data Deletion
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            At Splinzo, you have total control over your personal information. You can permanently delete
            your account and associated data directly within the mobile application or by submitting a
            deletion request online.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex flex-col gap-10">
          {/* Method 1: In-App */}
          <div className="p-8 rounded-3xl border border-gray-100 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 text-white font-black text-sm">
                1
              </span>
              <h2 className="text-2xl font-bold text-gray-900">
                Option A: Delete Instantly Inside the Android App
              </h2>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              If you have the Splinzo app installed on your device, you can delete your account and personal
              data immediately with zero waiting time:
            </p>
            <ol className="flex flex-col gap-3.5 text-gray-700 text-sm">
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Open the <strong>Splinzo</strong> mobile application on your device.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Navigate to the <strong>Profile</strong> tab in the bottom navigation bar.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Scroll down to the <strong>Account Settings</strong> section.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>
                  Tap on <strong className="text-red-600">Delete Account</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>
                  Review the confirmation warning and tap <strong>Confirm Delete</strong>. Your profile record and
                  authentication identity are permanently purged immediately.
                </span>
              </li>
            </ol>
          </div>

          {/* Method 2: Web Deletion Request */}
          <div className="p-8 rounded-3xl border border-gray-100 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-900 text-white font-black text-sm">
                2
              </span>
              <h2 className="text-2xl font-bold text-gray-900">
                Option B: Request Deletion via Web / Email
              </h2>
            </div>
            <p className="text-gray-600 mb-5 text-sm">
              If you have already uninstalled the app or cannot access your account, you can request full
              account and data removal through our privacy grievance desk:
            </p>
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">
                How to Submit:
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Send an email from your registered Splinzo email address with the subject line{" "}
                <code className="px-2 py-0.5 bg-gray-200 rounded text-gray-900 font-mono text-xs">
                  Splinzo Account Deletion Request
                </code>{" "}
                to:
              </p>
              <a
                href="mailto:privacy@splinzo.app?subject=Splinzo%20Account%20Deletion%20Request"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                ✉️ privacy@splinzo.app
              </a>
            </div>
            <p className="text-xs text-gray-500">
              * Verification will be performed to confirm ownership. Deletion requests submitted via email
              are processed within <strong>7 business days</strong>.
            </p>
          </div>

          {/* Data Retention & Scope */}
          <div className="p-8 rounded-3xl border border-gray-100 shadow-sm bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              What Data is Deleted vs. Retained?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white border border-gray-200/60">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-emerald-600 text-lg font-bold">✓</span>
                  <h3 className="font-bold text-gray-900 text-sm">Permanently Deleted Data</h3>
                </div>
                <ul className="text-xs text-gray-600 flex flex-col gap-2">
                  <li>• Name, registered email address, and profile photo</li>
                  <li>• Firebase Authentication UID and active sessions</li>
                  <li>• Device notification tokens (FCM Push tokens)</li>
                  <li>• Registered personal UPI ID and bank preference tags</li>
                  <li>• Direct personal contact list sync data</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200/60">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-amber-600 text-lg font-bold">⚠️</span>
                  <h3 className="font-bold text-gray-900 text-sm">Retained Compliance Logs</h3>
                </div>
                <ul className="text-xs text-gray-600 flex flex-col gap-2">
                  <li>• Anonymized historical settlement transaction records</li>
                  <li>• Official Bank UTR confirmation codes (mandatory under RBI/NPCI guidelines for statutory accounting & fraud prevention)</li>
                  <li>• Aggregate ledger balance calculations for existing group co-members</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">
              Have questions regarding your personal data? Read our full{" "}
              <Link href="/privacy-policy" className="font-semibold text-amber-700 underline">
                Privacy Policy
              </Link>{" "}
              or contact our data protection team at{" "}
              <a href="mailto:privacy@splinzo.app" className="font-semibold text-gray-900 underline">
                privacy@splinzo.app
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
