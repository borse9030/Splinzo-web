"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  requestWebPushPermission,
  syncWebPushToken,
  getIsIOS,
  getIsStandalone,
  isWebPushSupported,
} from "@/lib/firebase/webPush";
import { Bell, X, Sparkles, Smartphone, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WebNotificationBanner() {
  const { user, appUser } = useAuth();
  const currentUid = user?.uid || appUser?.id;

  const [visible, setVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (!currentUid || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const ios = getIsIOS();
    const standalone = getIsStandalone();
    setIsIOS(ios);
    setIsStandalone(standalone);

    // If already granted, silently sync token in background
    if (Notification.permission === "granted") {
      syncWebPushToken(currentUid);
      return;
    }

    // If denied, do not show
    if (Notification.permission === "denied") {
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("splinzo_web_notif_dismissed");
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Show banner after brief delay so it doesn't jarringly pop on immediate page load
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentUid]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem("splinzo_web_notif_dismissed", Date.now().toString());
    } catch {
      // Ignored
    }
  };

  const handleEnable = async () => {
    if (!currentUid) return;
    setIsActivating(true);
    try {
      const res = await requestWebPushPermission(currentUid);
      if (res) {
        setIsSuccess(true);
        setTimeout(() => {
          setVisible(false);
        }, 2200);
      } else {
        handleDismiss();
      }
    } catch {
      handleDismiss();
    } finally {
      setIsActivating(false);
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 px-4 py-2.5 shadow-md border-b border-amber-600/20 relative z-30"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
            <div className="h-8 w-8 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              {isSuccess ? <Check size={16} className="text-emerald-400" /> : <Bell size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black tracking-tight leading-tight flex items-center gap-1.5">
                <span>{isSuccess ? "Alerts Activated!" : "Never miss group expenses or payments"}</span>
                {!isSuccess && isIOS && !isStandalone && (
                  <span className="text-[10px] font-bold bg-slate-950 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Smartphone size={10} /> iPhone Tip
                  </span>
                )}
              </p>
              <p className="text-[11px] font-semibold text-slate-900 leading-tight mt-0.5 opacity-90">
                {isSuccess
                  ? "You will now receive instant notifications when friends add expenses or settle up."
                  : isIOS && !isStandalone
                  ? "Tap Turn On below, or for iPhone lockscreen push: tap Share (⎋) -> 'Add to Home Screen'."
                  : "Turn on notifications to get instant alerts on expense splits, reminders, and UPI settlements."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {!isSuccess && (
              <>
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={isActivating}
                  className="px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-950 text-amber-300 hover:bg-slate-900 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-70 flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                  <span>{isActivating ? "Enabling..." : "Turn On Alerts"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-full text-slate-800 hover:text-slate-950 hover:bg-black/10 transition-colors cursor-pointer"
                  title="Dismiss for 7 days"
                >
                  <X size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
