"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const PUBLIC_PATHS = ["/login", "/signup", "/", "/privacy-policy", "/terms", "/contact"];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
      } else if (user && !appUser) {
        // User is logged in via Firebase Auth but has no Firestore document yet
        // This can happen during signup before the document is created.
        // We'll let the signup/login pages handle the redirect.
      } else {
        // Logged in and has appUser document
        if (pathname === "/login" || pathname === "/signup") {
          router.push("/dashboard");
        }
      }
    }
  }, [user, appUser, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Prevent flashing protected content before redirect
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
