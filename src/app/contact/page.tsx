"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, MessageSquare, MapPin, Share2, ExternalLink, CheckCircle2, Copy } from "lucide-react";
import Image from "next/image";
import { ticketService } from "@/services/ticketService";
import { useAuth } from "@/contexts/AuthContext";
import { TicketCategory } from "@/types/ticket";

export default function Contact() {
  const { user, appUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (appUser || user) {
      setForm(f => ({
        ...f,
        name: f.name || appUser?.displayName || appUser?.name || user?.displayName || "",
        email: f.email || appUser?.email || user?.email || "",
      }));
    }
  }, [user, appUser]);

  const mapSubjectToCategory = (subj: string): TicketCategory => {
    switch (subj) {
      case "billing":
        return "billing_settlement";
      case "support":
        return "bug_report";
      case "feedback":
        return "feedback_feature";
      case "privacy":
        return "account_security";
      default:
        return "general";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await ticketService.createTicket({
        userId: user?.uid || null,
        userName: form.name,
        userEmail: form.email,
        subject: form.subject || "General Inquiry",
        message: form.message,
        category: mapSubjectToCategory(form.subject),
        priority: form.subject === "billing" ? "high" : "medium",
        source: "web_contact",
        deviceInfo: {
          platform: "web",
          browser: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      });
      setSubmittedTicketNumber(ticket.ticketNumber);
    } catch (err) {
      console.error("Failed to create ticket:", err);
      alert("Failed to submit message. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
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
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-gray-500 text-lg">
            Have a question, feedback, or just want to say hi?
            We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-5 py-14 grid md:grid-cols-2 gap-14 items-start">
        {/* Contact Info */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-8">Contact Information</h2>

          <div className="flex flex-col gap-6 mb-10">
            {[
              { icon: Mail, title: "Email", value: "support@splinzo.app", href: "mailto:support@splinzo.app" },
              { icon: MessageSquare, title: "Feedback", value: "feedback@splinzo.app", href: "mailto:feedback@splinzo.app" },
              { icon: MapPin, title: "Location", value: "India 🇮🇳", href: null },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                       style={{ background: "#FFF8E1" }}>
                    <Icon size={20} style={{ color: "#F9A825" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-500 mb-0.5">{item.title}</div>
                    {item.href ? (
                      <a href={item.href} className="font-semibold text-gray-900 hover:text-yellow-600 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ callout */}
          <div className="p-6 rounded-2xl" style={{ background: "#FFF8E1", border: "1px solid #F9B91230" }}>
            <div className="font-bold text-gray-900 mb-2">Looking for quick answers?</div>
            <p className="text-sm text-gray-600 mb-4">
              Many common questions are answered in our FAQ section.
            </p>
            <Link href="/#faq"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-transform hover:scale-105"
                  style={{ background: "#F9B912", color: "#1a1a1a" }}>
              Visit FAQ
            </Link>
          </div>

          {/* Social links */}
          <div className="mt-8">
            <div className="text-sm font-bold text-gray-500 mb-4">Follow us</div>
            <div className="flex gap-3">
              {[
                { icon: Share2, href: "#", label: "Share" },
                { icon: ExternalLink, href: "#", label: "Website" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href}
                     className="h-10 w-10 rounded-xl flex items-center justify-center border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all"
                     aria-label={s.label}>
                    <Icon size={18} className="text-gray-500" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          {submittedTicketNumber ? (
            <div className="flex flex-col items-center text-center py-14 px-8 rounded-3xl border border-gray-100 bg-white shadow-xl">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm"
                   style={{ background: "#FFF8E1" }}>
                ✅
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                Support Ticket Created
              </span>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Message Received!</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                Our support team has received your inquiry. Please save your ticket tracking number:
              </p>

              {/* Ticket Reference Badge */}
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-dashed mb-6 w-full max-w-xs justify-between"
                   style={{ borderColor: "#F9B91250", background: "#FFFDF6" }}>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Reference ID</div>
                  <div className="text-lg font-black text-gray-900 tracking-wide font-mono">
                    #{submittedTicketNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submittedTicketNumber);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 rounded-xl hover:bg-amber-100 transition-colors text-gray-600 hover:text-gray-900"
                  title="Copy Ticket Reference"
                >
                  {copied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                {user && (
                  <Link
                    href="/dashboard/support"
                    className="flex-1 py-3 rounded-full font-bold text-sm text-center shadow-md transition-transform hover:scale-105"
                    style={{ background: "#F9B912", color: "#1a1a1a" }}
                  >
                    View in Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicketNumber(null);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  }}
                  className="flex-1 py-3 rounded-full font-bold text-sm text-center border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Send Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="contact-name">
                    Full Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none transition-all focus:border-yellow-400 focus:ring-2"
                    style={{ focusBorderColor: "#F9B912" } as React.CSSProperties}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="contact-email">
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none transition-all focus:border-yellow-400 focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="contact-subject">
                  Subject *
                </label>
                <select
                  id="contact-subject"
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none bg-white transition-all focus:border-yellow-400"
                >
                  <option value="">Select a subject</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Product Feedback</option>
                  <option value="billing">Billing / Account</option>
                  <option value="privacy">Privacy Concern</option>
                  <option value="partnership">Partnership / Business</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="contact-message">
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none transition-all focus:border-yellow-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                style={{ background: "linear-gradient(135deg, #F9B912, #F9A000)", color: "#1a1a1a" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="h-5 w-5 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send Message →"
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-5 mt-8">
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
