"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { getApps } from "firebase/app";

export async function requestWebPushPermission(userId: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const app = getApps()[0];
    if (!app) return null;

    const messaging = getMessaging(app);

    // Retrieve FCM token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
    });

    if (token && userId && db) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokens: arrayUnion(token),
        webPushEnabled: true,
        fcmPlatform: "web",
        fcmUpdatedAt: serverTimestamp(),
      });
      return token;
    }

    return token || null;
  } catch (err) {
    console.warn("[webPush] Error requesting web push permission:", err);
    return null;
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
