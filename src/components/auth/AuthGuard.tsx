"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function isPublicRoute(pathname: string): boolean {
  if (!pathname) return false;

  // Normalize path by stripping trailing slash
  const cleanPath = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  const publicExactRoutes = [
    "/",
    "/about",
    "/blog",
    "/privacy-policy",
    "/terms",
    "/contact",
    "/login",
    "/signup",
    "/ads.txt",
  ];

  if (publicExactRoutes.includes(cleanPath)) {
    return true;
  }

  // Allow sub-routes for public dynamic sections (e.g. /blog/[slug], /join/[code])
  // and /admin (handled specifically by AdminGuard)
  const publicPrefixes = [
    "/blog/",
    "/join/",
    "/admin",
  ];

  return publicPrefixes.some((prefix) => cleanPath.startsWith(prefix));
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login if attempting to access protected route
        if (!isPublicRoute(pathname)) {
          setTimeout(() => router.push("/login"), 0);
        }
      } else if (user && !appUser) {
        // User is logged in via Firebase Auth but has no Firestore document yet
        // This can happen during signup before the document is created.
        // We'll let the signup/login pages handle the redirect.
      } else {
        // Logged in and has appUser document
        if (pathname === "/login" || pathname === "/signup") {
          setTimeout(() => router.push("/dashboard"), 0);
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
  if (!user && !isPublicRoute(pathname)) {
    return null;
  }

  return <>{children}</>;
}
