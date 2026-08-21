"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, User as UserIcon, Settings, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvitations } from "@/hooks/useInvitations";

const AMBER = "#F9B912";
const AMBER_BG = "#FFF8E1";

export function Navigation() {
  const pathname = usePathname();
  const { invitations } = useInvitations();

  const links = [
    { name: "Home", href: "/dashboard", icon: Home, exact: true },
    { name: "Groups", href: "/dashboard/groups", icon: Users, exact: false, activeOn: "/dashboard/groups" },
    { name: "Activity", href: "/dashboard/invitations", icon: Inbox, badge: invitations?.length || 0, exact: false },
    { name: "Profile", href: "/dashboard/profile", icon: UserIcon, exact: false },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white h-screen fixed" style={{ borderColor: "#F0F0F0" }}>
        <div className="p-6 border-b" style={{ borderColor: "#F5F5F5" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: "linear-gradient(135deg, #FFC107, #F9B912)" }}
            >
              <span className="font-extrabold text-lg" style={{ color: "#1a1a1a" }}>S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Splinzo</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {links.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : link.activeOn
              ? pathname.startsWith(link.activeOn)
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isActive
                    ? "text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
                style={isActive ? { background: AMBER_BG, color: "#1a1a1a" } : {}}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="h-5 w-5"
                    style={isActive ? { color: AMBER } : {}}
                  />
                  {link.name}
                </div>
                {(link.badge ?? 0) > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: AMBER, color: "#1a1a1a" }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "#F5F5F5" }}>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation — matches app exactly */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center h-[70px] px-2 z-50 safe-bottom"
        style={{
          background: "white",
          borderTop: "1px solid #F0F0F0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
          borderRadius: "24px 24px 0 0",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)",
        }}
      >
        {links.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : link.activeOn
            ? pathname.startsWith(link.activeOn)
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all"
            >
              <div className="relative">
                {isActive ? (
                  <div
                    className="p-2 rounded-2xl"
                    style={{ background: AMBER_BG }}
                  >
                    <Icon className="h-5 w-5" style={{ color: AMBER }} />
                  </div>
                ) : (
                  <Icon className="h-5 w-5 text-gray-400" />
                )}
                {(link.badge ?? 0) > 0 && (
                  <span
                    className="absolute -top-1 -right-2 text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                    style={{ background: AMBER, color: "#1a1a1a" }}
                  >
                    {link.badge}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold"
                style={isActive ? { color: AMBER } : { color: "#9E9E9E" }}
              >
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
