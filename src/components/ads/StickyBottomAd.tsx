"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AdsterraBanner } from "./AdsterraBanner";

export function StickyBottomAd() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if user previously dismissed in this session
    try {
      const isDismissed = sessionStorage.getItem("splinzo_bottom_ad_dismissed");
      if (!isDismissed) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("splinzo_bottom_ad_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-[74px] md:bottom-2 left-0 right-0 z-40 flex flex-col items-center pointer-events-none transition-all"
    >
      <div className="pointer-events-auto relative w-full max-w-3xl mx-auto px-3">
        <div
          className="relative rounded-2xl p-1.5 backdrop-blur-md border shadow-2xl transition-all"
          style={{
            background: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(226, 232, 240, 0.9)",
            boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Header pill: label and dismiss button */}
          <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Sponsored Partner
            </span>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              title="Close advertisement"
            >
              <span>Close</span>
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Ad unit container */}
          <div className="w-full flex justify-center items-center overflow-hidden">
            <AdsterraBanner
              adKey="ae9d16cc9abc184e693997fd2e0102fb"
              width={728}
              height={90}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
