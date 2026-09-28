"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { getApps } from "firebase/app";

export function getIsIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function getWebPushPlatform(): string {
  if (getIsIOS()) {
    return getIsStandalone() ? "ios_pwa" : "ios_web";
  }
  if (typeof navigator !== "undefined" && /Android/.test(navigator.userAgent)) {
    return "android_web";
  }
  return "desktop_web";
}

export async function requestWebPushPermission(userId: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.info("[webPush] Firebase Messaging is not supported in this browser environment.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    // Register service worker with root scope
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    // Ensure service worker is active
    await navigator.serviceWorker.ready;

    const app = getApps()[0];
    if (!app) return null;

    const messaging = getMessaging(app);
    const platform = getWebPushPlatform();

    let token: string | null = null;
    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || undefined;
      token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        ...(vapidKey ? { vapidKey } : {}),
      });
    } catch (tokenErr) {
      console.warn("[webPush] Note: Web Push Token generation requires a VAPID key in production. In-app notifications remain active.", tokenErr);
    }

    // Always update user document in Firestore to enable in-app notification center and store device info
    if (userId && db) {
      const userRef = doc(db, "users", userId);
      const updateData: Record<string, any> = {
        webPushEnabled: true,
        webInboxEnabled: true,
        fcmPlatform: platform,
        webNotificationPermission: "granted",
        lastActiveAt: serverTimestamp(),
      };

      if (token && typeof token === "string" && token.length > 10) {
        updateData.fcmToken = token;
        updateData.fcmTokens = arrayUnion(token);
        updateData.fcmUpdatedAt = serverTimestamp();
      }

      await updateDoc(userRef, updateData);
    }

    return token || "inbox_ready";
  } catch (err) {
    console.warn("[webPush] Error requesting web push permission:", err);
    return null;
  }
}

/**
 * Silently refreshes and syncs the user's web notification state if permission was already granted.
 */
export async function syncWebPushToken(userId: string): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted" && userId) {
    try {
      await requestWebPushPermission(userId);
    } catch (err) {
      console.debug("[webPush] Silent sync notice:", err);
    }
  }
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function getWebPushPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
