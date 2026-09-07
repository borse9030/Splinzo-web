import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/serverDb";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

      const db = getServerDb();
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
