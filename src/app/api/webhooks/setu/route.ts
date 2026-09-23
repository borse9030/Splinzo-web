import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/serverDb";
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

        // Mark master payment as approved
        await updateDoc(paymentRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
          utr,
          verifiedVia: "setu_webhook",
        });

        // If batch settlement, create child approved records for each individual creditor
        if (paymentData.type === "batch" && Array.isArray(paymentData.batchItems)) {
          for (const item of paymentData.batchItems) {
            const childPaymentId = `pay_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const childRef = doc(db, "payments", childPaymentId);
            await setDoc(childRef, {
              id: childPaymentId,
              groupId: paymentData.groupId,
              fromUserId: paymentData.fromUserId,
              fromUserName: paymentData.fromUserName,
              toUserId: item.toUserId,
              toUserName: item.toUserName,
              amount: Number(item.amount),
              platformFee: 0,
              totalAmount: Number(item.amount),
              status: "approved",
              approvedAt: serverTimestamp(),
              utr,
              batchMasterId: paymentId,
              verifiedVia: "setu_webhook_child",
              createdAt: serverTimestamp(),
            });
          }
        }

        // Add activity record in group
        if (paymentData.groupId) {
          try {
            const activityMessage = paymentData.type === "batch"
              ? `${paymentData.fromUserName} cleared all ${paymentData.batchItems?.length || "group"} dues (total ₹${paymentData.amount}) in 1 single UPI transaction (UTR: ${utr})`
              : `${paymentData.fromUserName} settled ₹${paymentData.amount} with ${paymentData.toUserName} via Instant UPI (UTR: ${utr})`;

            await addDoc(collection(db, "groups", paymentData.groupId, "activities"), {
              type: "settlement_paid",
              message: activityMessage,
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
