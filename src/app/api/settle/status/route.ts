import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { setuClient } from "@/lib/fintech/setuClient";

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
    ? initializeApp(firebaseConfig, "setu-status-app")
    : getApp("setu-status-app");
  return getFirestore(app);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const linkId = searchParams.get("linkId");

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const db = getDb();
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentSnap.data();

    // If already approved (e.g. via webhook or previous poll)
    if (payment.status === "approved") {
      return NextResponse.json({
        status: "PAID",
        utr: payment.utr || "BANK_VERIFIED",
        approvedAt: payment.approvedAt,
      });
    }

    // Check Setu directly if linkId exists
    if (linkId) {
      const setuStatus = await setuClient.checkPaymentStatus(linkId);
      if (setuStatus.status === "PAID") {
        const utr = setuStatus.utr || `UPI${Date.now()}`;
        await updateDoc(paymentRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
          utr,
        });

        return NextResponse.json({
          status: "PAID",
          utr,
        });
      }
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (err: any) {
    console.error("[/api/settle/status] Error:", err);
    return NextResponse.json({ error: err.message || "Status check failed" }, { status: 500 });
  }
}

/**
 * Endpoint for instant testing in sandbox/mock mode
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentId, simulateSuccess } = await req.json();
    if (!paymentId || !simulateSuccess) {
      return NextResponse.json({ error: "Invalid simulation request" }, { status: 400 });
    }

    const db = getDb();
    const paymentRef = doc(db, "payments", paymentId);
    const mockUtr = `SIM${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    await updateDoc(paymentRef, {
      status: "approved",
      approvedAt: serverTimestamp(),
      utr: mockUtr,
      verifiedVia: "setu_simulation",
    });

    return NextResponse.json({
      success: true,
      status: "PAID",
      utr: mockUtr,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
