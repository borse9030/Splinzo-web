"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Users, User as UserIcon, Settings, Inbox, LifeBuoy, Smartphone, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvitations } from "@/hooks/useInvitations";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { WebNotificationBanner } from "@/components/notifications/WebNotificationBanner";
import { motion } from "framer-motion";

const AMBER     = "#F9B912";
const AMBER_BG  = "#FFF8E1";

export function Navigation() {
  const pathname = usePathname();
  const { appUser } = useAuth();
  const { invitations } = useInvitations();
  const { unreadCount } = useNotifications();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const links = [
    { name: "Home",     href: "/dashboard",             icon: Home,     exact: true  },
    { name: "Groups",   href: "/dashboard/groups",       icon: Users,    exact: false, activeOn: "/dashboard/groups" },
    { name: "Contacts", href: "/dashboard/contacts",     icon: Smartphone, exact: false },
    { name: "Activity", href: "/dashboard/activity",  icon: Inbox,    badge: invitations?.length || 0, exact: false },
    { name: "Support",  href: "/dashboard/support",   icon: LifeBuoy, exact: false },
    { name: "Profile",  href: "/dashboard/profile",      icon: UserIcon, exact: false },
  ];

  const mobileLinks = [
    { name: "Home",     href: "/dashboard",             icon: Home,     exact: true  },
    { name: "Groups",   href: "/dashboard/groups",       icon: Users,    exact: false, activeOn: "/dashboard/groups" },
    { name: "Contacts", href: "/dashboard/contacts",     icon: Smartphone, exact: false },
    { name: "Activity", href: "/dashboard/activity",  icon: Inbox,    badge: invitations?.length || 0, exact: false },
    { name: "Profile",  href: "/dashboard/profile",      icon: UserIcon, exact: false },
  ];

  const isLinkActive = (link: typeof links[0]) =>
    link.exact
      ? pathname === link.href
      : link.activeOn
      ? pathname.startsWith(link.activeOn)
      : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <>
      {/* Web notification permission banner for website & iPhone users */}
      <div className="w-full md:pl-64">
        <WebNotificationBanner />
      </div>

      {/* ═══════════ MOBILE TOP HEADER WITH BELL & SETTINGS ═══════════ */}
      {!pathname.startsWith("/groups") && (
        <header className="md:hidden sticky top-0 z-40 w-full px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Splinzo" width={28} height={28} className="rounded-lg shadow-xs" priority />
            <span className="font-extrabold text-base tracking-tight text-foreground">Splinzo</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard/settings"
              className={cn(
                "p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
                pathname === "/dashboard/settings" && "bg-amber-500/15 text-amber-500"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-muted/60 text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold px-1 bg-amber-500 text-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* ═══════════ DESKTOP SIDEBAR ═══════════ */}
      <aside
        className="hidden md:flex flex-col w-64 h-screen fixed overflow-hidden"
        style={{
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Subtle background doodle */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-48 overflow-hidden opacity-[0.04]" aria-hidden="true">
          <svg viewBox="0 0 256 192" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="140" r="60" stroke="#F9B912" strokeWidth="3" strokeDasharray="8 5"/>
            <path d="M10 170 Q 60 120 110 160 Q 160 200 210 150" stroke="#F9B912" strokeWidth="2.5" strokeDasharray="6 4"/>
            <text x="170" y="180" fontSize="40" fill="#F9B912" fontWeight="900" opacity="0.6">₹</text>
          </svg>
        </div>

        {/* Logo and Notification Bell */}
        <div className="relative p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <Image src="/logo.png" alt="Splinzo" width={36} height={36}
                     className="rounded-xl shadow-sm transition-transform group-hover:scale-105" priority />
              {/* Amber glow on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
                   style={{ background: AMBER, mixBlendMode: "multiply" }}/>
            </div>
            <div>
              <span className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>Splinzo</span>
              <div className="text-[10px] font-semibold -mt-0.5" style={{ color: "var(--muted-foreground)" }}>Smart Expense Sharing</div>
            </div>
          </Link>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-card" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 relative z-10">
          {links.map((link) => {
            const isActive = isLinkActive(link);
            const Icon = link.icon;
            return (
              <Link key={link.name} href={link.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer",
                    isActive ? "" : "hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                  style={{
                    color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                    background: isActive ? "var(--sidebar-accent)" : "transparent"
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                      style={{ background: AMBER }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    {/* Icon wrapper */}
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden"
                      style={{
                        background: isActive ? `rgba(249,185,18,0.2)` : "transparent",
                      }}
                    >
                      {link.name === "Profile" && (appUser?.photoUrl || appUser?.photoURL) ? (
                        <img src={appUser.photoUrl || appUser.photoURL} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-4 w-4" style={isActive ? { color: AMBER } : {}} />
                      )}
                    </div>
                    {link.name}
                  </div>

                  {/* Badge */}
                  {(link.badge ?? 0) > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: AMBER, color: "#1a1a1a" }}
                    >
                      {link.badge}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="relative z-10 p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/dashboard/settings">
            <motion.div
              whileHover={{ x: 2 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: "var(--muted-foreground)" }}
            >
              <div className="h-8 w-8 rounded-xl flex items-center justify-center">
                <Settings className="h-4 w-4" />
              </div>
              Settings
            </motion.div>
          </Link>
        </div>
      </aside>

      {/* ═══════════ MOBILE BOTTOM NAV ═══════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center z-50"
        style={{
          height: 68,
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.08)",
          borderRadius: "24px 24px 0 0",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)",
        }}
      >
        {mobileLinks.map((link) => {
          const isActive = isLinkActive(link);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="relative flex flex-col items-center gap-1"
              >
                <div className="relative">
                  <div
                    className="p-2.5 rounded-2xl transition-all duration-200 overflow-hidden"
                    style={isActive ? { background: "var(--sidebar-accent)" } : {}}
                  >
                    {link.name === "Profile" && (appUser?.photoUrl || appUser?.photoURL) ? (
                      <div className="h-5 w-5 rounded-full overflow-hidden border border-transparent" style={isActive ? { borderColor: AMBER } : {}}>
                        <img src={appUser.photoUrl || appUser.photoURL} alt="Profile" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <Icon className="h-5 w-5" style={{ color: isActive ? AMBER : "var(--muted-foreground)" }} />
                    )}
                  </div>
                  {(link.badge ?? 0) > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold px-1"
                      style={{ background: AMBER, color: "#1a1a1a" }}
                    >
                      {link.badge}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? AMBER : "var(--muted-foreground)" }}
                >
                  {link.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Slide-over Notification Center */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
