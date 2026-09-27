"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  type?: string;
  bannerStyle?: string;
  actionType?: string;
  actionData?: Record<string, any>;
  groupId?: string;
  groupName?: string;
  isRead: boolean;
  campaignId?: string;
  createdAt?: any;
}

export function useNotifications() {
  const { user, appUser } = useAuth();
  const currentUid = user?.uid || appUser?.id;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid || !db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const notifsRef = collection(db, "users", currentUid, "notifications");
      const q = query(notifsRef, orderBy("createdAt", "desc"), limit(50));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: AppNotification[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const isRead = Boolean(data.isRead ?? data.read ?? false);
            return {
              id: docSnap.id,
              title: data.title || "Notification",
              body: data.body || "",
              imageUrl: data.imageUrl || null,
              type: data.type || "general",
              bannerStyle: data.bannerStyle || "standard",
              actionType: data.actionType || (data.groupId ? "group" : "home"),
              actionData: data.actionData || data.data || {},
              groupId: data.groupId || "",
              groupName: data.groupName || "",
              isRead,
              campaignId: data.campaignId || "",
              createdAt: data.createdAt,
            };
          });
          setNotifications(list);
          setLoading(false);
        },
        (error) => {
          console.warn("[useNotifications] Snapshot listener warning:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("[useNotifications] Error setting up listener:", err);
      setLoading(false);
    }
  }, [currentUid]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (notificationId: string, campaignId?: string) => {
      if (!currentUid || !db) return;
      try {
        const notifDoc = doc(db, "users", currentUid, "notifications", notificationId);
        await updateDoc(notifDoc, {
          isRead: true,
          read: true,
          readAt: serverTimestamp(),
        });

        // Fire tracking endpoint asynchronously
        fetch("/api/notifications/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId,
            userId: currentUid,
            campaignId: campaignId || "",
          }),
        }).catch(() => {});
      } catch (e) {
        console.error("[useNotifications] Failed to mark notification as read:", e);
      }
    },
    [currentUid]
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUid || !db) return;
    const unreadList = notifications.filter((n) => !n.isRead);
    if (unreadList.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadList.forEach((n) => {
        const notifDoc = doc(db, "users", currentUid, "notifications", n.id);
        batch.update(notifDoc, {
          isRead: true,
          read: true,
          readAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (e) {
      console.error("[useNotifications] Failed to mark all as read:", e);
    }
  }, [currentUid, notifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!currentUid || !db) return;
      try {
        const notifDoc = doc(db, "users", currentUid, "notifications", notificationId);
        await deleteDoc(notifDoc);
      } catch (e) {
        console.error("[useNotifications] Failed to delete notification:", e);
      }
    },
    [currentUid]
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
