import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "fallback",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fallback",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fallback",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fallback",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "fallback",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "fallback",
};

function getDb() {
  const app = !getApps().length
    ? initializeApp(firebaseConfig, "setu-webhook-app")
    : getApp("setu-webhook-app");
  return getFirestore(app);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[Setu Webhook Received]:", JSON.stringify(payload));

    const event = payload.event || payload.eventType;
    const data = payload.data || payload;

    // Handle payment success event
    if (event === "PAYMENT_SUCCESS" || data.status === "PAID") {
      const paymentId = data.billerBillID || data.billId || payload.billerBillID;
      const utr = data.refID || data.transactionReference || data.utr || "BANK_VERIFIED";

      if (!paymentId) {
        console.warn("[Setu Webhook] No payment ID found in payload");
        return NextResponse.json({ ok: true, note: "Ignored, missing billerBillID" });
      }

      const db = getDb();
      const paymentRef = doc(db, "payments", paymentId);
      const paymentSnap = await getDoc(paymentRef);

      if (paymentSnap.exists()) {
        const paymentData = paymentSnap.data();

        // Mark payment as approved
        await updateDoc(paymentRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
          utr,
          verifiedVia: "setu_webhook",
        });

        // Add activity record in group
        if (paymentData.groupId) {
          try {
            await addDoc(collection(db, "groups", paymentData.groupId, "activities"), {
              type: "settlement_paid",
              message: `${paymentData.fromUserName} settled ₹${paymentData.amount} with ${paymentData.toUserName} via Instant UPI (UTR: ${utr})`,
              createdAt: serverTimestamp(),
            });
          } catch (e) {
            console.error("[Setu Webhook] Error recording activity:", e);
          }
        }

        console.log(`[Setu Webhook] Payment ${paymentId} marked as APPROVED with UTR: ${utr}`);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook acknowledged" });
  } catch (err: any) {
    console.error("[Setu Webhook Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
