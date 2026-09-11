"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { clearStaffSession, getCurrentStaffSession, CurrentStaffSession } from "@/lib/adminAuth";
import {
  LayoutDashboard,
  LifeBuoy,
  Users,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Briefcase,
} from "lucide-react";

const AMBER = "#F9B912";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<CurrentStaffSession | null>(null);
  const [agentName, setAgentName] = useState("Staff Agent");

  useEffect(() => {
    const current = getCurrentStaffSession();
    setSession(current);
    if (current?.name) setAgentName(current.name);

    // If staff member lands on root /admin, forward to their workspace
    if (current && !current.isSuperAdmin && pathname === "/admin") {
      router.replace("/admin/workspace");
    }
  }, [pathname, router]);

  const handleSignOut = () => {
    clearStaffSession();
    router.push("/login");
  };

  const isSuperAdmin = session?.isSuperAdmin ?? true;

  const navLinks = isSuperAdmin
    ? [
        { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
        { name: "Tickets Matrix", href: "/admin/tickets", icon: LifeBuoy, exact: false },
        { name: "Staff Management", href: "/admin/staff", icon: ShieldCheck, exact: false },
        { name: "User Directory", href: "/admin/users", icon: Users, exact: false },
      ]
    : [
        { name: "My Workspace", href: "/admin/workspace", icon: Briefcase, exact: true },
        { name: "All Tickets", href: "/admin/tickets", icon: LifeBuoy, exact: false },
      ];

  return (
    <AdminGuard>
      <div className="min-h-screen flex text-gray-900" style={{ background: "#F9F7F2", fontFamily: "'Outfit', sans-serif" }}>
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex flex-col w-64 border-r border-gray-200/80 bg-white shadow-sm shrink-0">
          {/* Brand Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Splinzo" width={34} height={34} className="rounded-xl shadow-sm" />
              <div>
                <span className="font-black text-base tracking-tight text-gray-900 block leading-none">Splinzo</span>
                <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-wider">Admin Console</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-50 text-gray-950 border border-amber-200 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? "bg-[#F9B912] text-gray-950 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <span>{link.name}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-amber-600" />}
                </Link>
              );
            })}
          </nav>

          {/* Agent Info & Actions */}
          <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/40">
            <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-black text-amber-700 text-sm">
                {agentName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-900 truncate">{agentName}</div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                title="Open Public Website"
              >
                <ExternalLink size={12} />
                Site
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200/60 text-red-600 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="Lock & Exit Console"
              >
                <LogOut size={12} />
                Lock
              </button>
            </div>
          </div>
        </aside>

        {/* ── MOBILE TOP BAR & MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden border-b border-gray-200/80 p-4 bg-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Splinzo" width={28} height={28} className="rounded-lg shadow-xs" />
              <span className="font-black text-sm text-gray-900">Splinzo Console</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          {/* Mobile Navigation Tabs */}
          <div className="md:hidden flex border-b border-gray-200/80 bg-white/90 overflow-x-auto px-2 py-1.5 gap-1.5">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-xl transition-colors ${
                    isActive
                      ? "bg-amber-400 text-gray-950 shadow-xs"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Page Content */}
          <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
