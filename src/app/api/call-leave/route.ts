import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, runTransaction } from "firebase/firestore";

// Reuse the client-side Firebase config for the API route (no Admin SDK needed)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getDb() {
  const app = !getApps().length
    ? initializeApp(firebaseConfig, "call-leave-app")
    : getApp("call-leave-app");
  return getFirestore(app);
}

export async function POST(req: NextRequest) {
  try {
    const { groupId, callId, uid } = await req.json();
    if (!groupId || !callId || !uid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getDb();
    const callDoc = doc(db, "groups", groupId, "calls", callId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(callDoc);
      if (!snap.exists()) return;
      const participants: string[] = snap.data()?.participants || [];
      const remaining = participants.filter((p: string) => p !== uid);
      tx.update(callDoc, {
        participants: remaining,
        ...(remaining.length === 0 ? { status: "ended" } : {}),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[call-leave]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
