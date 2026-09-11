"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasStaffSession, isStaffOrAdmin, getCurrentStaffSession } from "@/lib/adminAuth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { appUser, loading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      const isAuth = hasStaffSession() || isStaffOrAdmin(appUser);
      if (!isAuth) {
        setAuthorized(false);
        router.replace("/login");
        return;
      }

      const session = getCurrentStaffSession();
      // Restrict staff creation & user management to Super Admin only
      if (
        (pathname.startsWith("/admin/staff") || pathname.startsWith("/admin/users")) &&
        session &&
        !session.isSuperAdmin
      ) {
        router.replace("/admin/workspace");
        return;
      }

      setAuthorized(true);
    }
  }, [loading, appUser, pathname, router]);

  if (loading || authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Verifying Staff Access…
          </span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
