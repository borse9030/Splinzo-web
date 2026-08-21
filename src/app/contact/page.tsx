"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, MapPin, Share2, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with real API call
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
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
          {submitted ? (
            <div className="flex flex-col items-center text-center py-16 px-8 rounded-3xl border border-gray-100">
              <div className="h-20 w-20 rounded-full flex items-center justify-center text-4xl mb-6"
                   style={{ background: "#FFF8E1" }}>
                🎉
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Message Sent!</h3>
              <p className="text-gray-500 mb-8">
                Thanks for reaching out! We&apos;ll get back to you within 24–48 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="px-6 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105"
                style={{ background: "#F9B912", color: "#1a1a1a" }}
              >
                Send Another Message
              </button>
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
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
