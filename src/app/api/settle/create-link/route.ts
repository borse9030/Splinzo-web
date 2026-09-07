import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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
    ? initializeApp(firebaseConfig, "setu-settle-app")
    : getApp("setu-settle-app");
  return getFirestore(app);
}

const PLATFORM_FEE = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_INR || 1);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { groupId, fromUserId, fromUserName, toUserId, toUserName, amount, receiverUpiId, expenseId } = body;

    if (!groupId || !fromUserId || !toUserId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid settlement parameters" }, { status: 400 });
    }

    const baseAmount = Number(amount);
    const platformFee = PLATFORM_FEE;
    const totalAmount = Number((baseAmount + platformFee).toFixed(2));
    const amountInPaise = Math.round(totalAmount * 100);

    const db = getDb();
    // Unique payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentRef = doc(db, "payments", paymentId);

    // Save initial record in Firestore
    await setDoc(paymentRef, {
      id: paymentId,
      groupId,
      fromUserId,
      fromUserName: fromUserName || "Member",
      toUserId,
      toUserName: toUserName || "Member",
      amount: baseAmount,
      platformFee,
      totalAmount,
      expenseId: expenseId || "",
      status: "pending_approval",
      verifiedVia: "setu",
      createdAt: serverTimestamp(),
    });

    // Generate Setu Tracked UPI Deeplink
    const setuResponse = await setuClient.createPaymentLink({
      billerBillID: paymentId,
      amountInPaise,
      description: `Splinzo: Settle ₹${baseAmount} with ${toUserName}`,
      receiverUpiId,
      receiverName: toUserName,
    });

    // Store setuLinkId on the payment doc
    await updateDoc(paymentRef, {
      setuLinkId: setuResponse.linkId,
    });

    return NextResponse.json({
      success: true,
      paymentId,
      linkId: setuResponse.linkId,
      upiUrl: setuResponse.upiUrl,
      shortUrl: setuResponse.shortUrl,
      qrData: setuResponse.qrData || setuResponse.upiUrl,
      baseAmount,
      platformFee,
      totalAmount,
      isSimulated: setuResponse.isSimulated,
    });
  } catch (err: any) {
    console.error("[/api/settle/create-link] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create payment link" }, { status: 500 });
  }
}
