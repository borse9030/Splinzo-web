"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number; // Exactly 1900ms (1.90 seconds)
}

export function SplashScreen({ onComplete, durationMs = 1900 }: SplashScreenProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isExiting, setIsExiting] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Lock body scroll while splash is active
    document.body.style.overflow = "hidden";

    // Guaranteed 1.90 seconds timer
    const timer = setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;

      // Begin exit dissolve
      setIsExiting(true);

      // Handle destination routing based on authentication
      if (user) {
        if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
          router.replace("/dashboard");
        }
      } else {
        if (pathname === "/" || pathname === "/dashboard") {
          router.replace("/login");
        }
      }

      // Allow 350ms exit fade animation to finish before unmounting
      setTimeout(() => {
        document.body.style.overflow = "";
        onComplete?.();
      }, 350);
    }, durationMs);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [durationMs, user, pathname, router, onComplete]);

  // Click/tap anywhere to skip immediately
  const handleSkip = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    setIsExiting(true);

    if (user) {
      if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
        router.replace("/dashboard");
      }
    } else {
      if (pathname === "/" || pathname === "/dashboard") {
        router.replace("/login");
      }
    }

    setTimeout(() => {
      document.body.style.overflow = "";
      onComplete?.();
    }, 250);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="splinzo-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          onClick={handleSkip}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white cursor-pointer select-none"
          style={{ backgroundColor: "#FFFFFF" }}
          title="Click to skip"
        >
          {/* Main Visual Container */}
          <div className="relative flex flex-col items-center justify-center w-full h-full px-4 py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{
                opacity: 1,
                scale: [0.98, 1.018, 1],
                y: 0,
              }}
              transition={{
                opacity: { duration: 0.45, ease: "easeOut" },
                scale: {
                  duration: 1.9,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                y: { duration: 0.45, ease: "easeOut" },
              }}
              className="relative flex items-center justify-center max-h-[82vh] w-auto max-w-[92vw] sm:max-w-md"
            >
              {/* Using direct img tag to guarantee instant zero-layout-shift rendering */}
              <img
                src="/startup.png"
                alt="Splinzo Startup"
                style={{
                  maxHeight: "80vh",
                  maxWidth: "90vw",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                }}
                className="select-none pointer-events-none drop-shadow-sm"
              />
            </motion.div>

            {/* Subtle Progress Bar (1.90 seconds linear fill) */}
            <div className="absolute bottom-8 sm:bottom-12 flex flex-col items-center gap-2">
              <div className="w-36 sm:w-44 h-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFB800] to-[#F9A000] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: durationMs / 1000, ease: "linear" }}
                />
              </div>
              <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
                Loading Splinzo
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
