import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "fallback",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fallback",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fallback",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fallback",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "fallback",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "fallback",
};

export function getServerDb() {
  const app =
    getApps().find((a) => a.name === "splinzo-server") ||
    initializeApp(firebaseConfig, "splinzo-server");
  return getFirestore(app);
}
