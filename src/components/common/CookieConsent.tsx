"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Cookie } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("splinzo_cookie_consent");
    if (!consent) {
      // Small delay so it doesn't pop up instantly, providing a better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("splinzo_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Note: To be fully compliant, this would need to disable non-essential cookies.
    localStorage.setItem("splinzo_cookie_consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-50"
        >
          <div 
            className="p-5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col gap-4"
            style={{ 
              background: "var(--card)", 
              border: "1px solid var(--border)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
            }}
          >
            {/* Close button */}
            <button 
              onClick={handleDecline}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#FFF8E1", color: "#F9B912" }}
              >
                <Cookie className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
                We use cookies
              </h3>
            </div>
            
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              We use cookies to personalize content, show targeted ads (like Google AdSense), and analyze our traffic. 
              By clicking &quot;Accept&quot;, you consent to our use of cookies.
            </p>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={handleDecline}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
                style={{ background: "#F9B912", color: "#1a1a1a" }}
              >
                Accept
              </button>
            </div>

            <p className="text-center text-xs mt-1">
              <Link href="/privacy-policy" className="underline hover:text-gray-900 transition-colors" style={{ color: "var(--muted-foreground)" }}>
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
