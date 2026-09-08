"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SplashScreen } from "@/components/splash/SplashScreen";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Show splash on every app opening / initial load
  const [showSplash, setShowSplash] = useState(true);

  const PUBLIC_PATHS = ["/login", "/signup", "/", "/privacy-policy", "/terms", "/contact"];

  useEffect(() => {
    // Only handle standard redirects if splash is not actively playing
    if (!showSplash && !loading) {
      if (!user) {
        // Not logged in, redirect to login if attempting to access protected route
        if (!PUBLIC_PATHS.includes(pathname)) {
          setTimeout(() => router.push("/login"), 0);
        }
      } else if (user && !appUser) {
        // Logged in via Firebase Auth but waiting for Firestore doc
      } else {
        // Logged in and has appUser document
        if (pathname === "/login" || pathname === "/signup") {
          setTimeout(() => router.push("/dashboard"), 0);
        }
      }
    }
  }, [user, appUser, loading, router, pathname, showSplash]);

  // If splash animation is active, render the startup screen for 1.90s
  if (showSplash) {
    return (
      <>
        <SplashScreen durationMs={1900} onComplete={() => setShowSplash(false)} />
        {/* Render children in background so destination page is ready under the dissolve */}
        <div style={{ visibility: "hidden" }}>{children}</div>
      </>
    );
  }

  // Fallback loader if loading state persists after splash
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFB800] border-t-transparent"></div>
      </div>
    );
  }

  // Prevent flashing protected content before redirect
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
