"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import {
  requestWebPushPermission,
  getWebPushPermissionState,
  isWebPushSupported,
} from "@/lib/firebase/webPush";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Droplets,
  Receipt,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Inbox,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const router = useRouter();
  const { user, appUser } = useAuth();
  const currentUid = user?.uid || appUser?.id;
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"all" | "expenses" | "duties" | "broadcasts">("all");
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const permissionState = typeof window !== "undefined" ? getWebPushPermissionState() : "default";

  const handleEnablePush = async () => {
    if (!currentUid) return;
    setEnablingPush(true);
    setPushStatus(null);
    try {
      const token = await requestWebPushPermission(currentUid);
      if (token) {
        setPushStatus("Desktop alerts activated!");
      } else {
        setPushStatus("Notification permission was denied or dismissed.");
      }
    } catch {
      setPushStatus("Could not enable desktop alerts.");
    } finally {
      setEnablingPush(false);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id, notif.campaignId);
    }

    onClose();

    if (notif.actionData?.externalUrl && typeof notif.actionData.externalUrl === "string") {
      window.open(notif.actionData.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (notif.actionType === "group" && notif.groupId) {
      router.push(`/groups/${notif.groupId}`);
    } else if (notif.actionType === "expense" && notif.groupId) {
      router.push(`/groups/${notif.groupId}`);
    } else if (notif.groupId) {
      router.push(`/groups/${notif.groupId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "expenses") {
      return n.type === "expense" || n.bannerStyle === "blinkit" || n.actionType === "expense";
    }
    if (activeTab === "duties") {
      return (
        n.type?.startsWith("water") ||
        n.type === "chore" ||
        n.type === "flat_hq" ||
        n.bannerStyle === "water_duty" ||
        n.bannerStyle === "guilt_jar"
      );
    }
    if (activeTab === "broadcasts") {
      return n.type === "admin_broadcast" || n.bannerStyle === "celebration";
    }
    return true;
  });

  const getStyleTheme = (notif: AppNotification) => {
    const style = notif.bannerStyle || notif.type;
    if (style === "water_duty" || notif.type?.startsWith("water")) {
      return {
        badge: "Water Duty",
        badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        icon: <Droplets className="w-4 h-4 text-blue-500" />,
        accentBorder: "border-l-blue-500",
      };
    }
    if (style === "guilt_jar" || notif.type === "guilt_jar") {
      return {
        badge: "Guilt Jar",
        badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
        accentBorder: "border-l-amber-500",
      };
    }
    if (style === "expense" || notif.type === "expense") {
      return {
        badge: "Settlement",
        badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        icon: <Receipt className="w-4 h-4 text-emerald-500" />,
        accentBorder: "border-l-emerald-500",
      };
    }
    return {
      badge: "Announcement",
      badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      accentBorder: "border-l-purple-500",
    };
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "Just now";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-black">
                        {unreadCount} new
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">Real-time alerts across Splinzo</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="p-2 text-xs font-medium text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Read all</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Web Push Prompt Banner */}
            {isWebPushSupported() && permissionState !== "granted" && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-start gap-3">
                <Volume2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-foreground">Enable Desktop Push Alerts</p>
                  <p className="text-muted-foreground mt-0.5">
                    Get instant notifications even when this browser tab is closed.
                  </p>
                  <button
                    onClick={handleEnablePush}
                    disabled={enablingPush}
                    className="mt-2 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
                  >
                    {enablingPush ? "Enabling..." : "Allow Desktop Push"}
                  </button>
                  {pushStatus && <p className="mt-1 text-[11px] text-amber-400">{pushStatus}</p>}
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-3 px-4 border-b border-border overflow-x-auto scrollbar-none">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "expenses", label: "Expenses" },
                  { id: "duties", label: "Duties" },
                  { id: "broadcasts", label: "Broadcasts" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    activeTab === tab.id
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Syncing notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                      No notifications in this tab. New expenses, water duty, and group pings will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const theme = getStyleTheme(notif);
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group relative p-3.5 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-all cursor-pointer ${
                        !notif.isRead ? "border-l-4 " + theme.accentBorder + " bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon or Thumbnail */}
                        {notif.imageUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border relative">
                            <Image
                              src={notif.imageUrl}
                              alt={notif.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                            {theme.icon}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}
                            >
                              {theme.badge}
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {formatTimestamp(notif.createdAt)}
                            </span>
                          </div>

                          <h3
                            className={`text-sm tracking-tight truncate ${
                              !notif.isRead ? "font-bold text-foreground" : "font-medium text-foreground/90"
                            }`}
                          >
                            {notif.title}
                          </h3>

                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.body}
                          </p>

                          {/* Action Footer */}
                          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/60">
                            <span className="text-[11px] font-medium text-amber-500 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              View details <ChevronRight className="w-3 h-3" />
                            </span>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {!notif.isRead && (
                                <button
                                  onClick={() => markAsRead(notif.id, notif.campaignId)}
                                  title="Mark as read"
                                  className="p-1 hover:text-amber-500 text-muted-foreground transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                title="Delete"
                                className="p-1 hover:text-red-500 text-muted-foreground transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
