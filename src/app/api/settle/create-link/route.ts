import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/serverDb";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { setuClient } from "@/lib/fintech/setuClient";

const PLATFORM_FEE = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_INR || 1);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      groupId, 
      fromUserId, 
      fromUserName, 
      toUserId, 
      toUserName, 
      amount, 
      receiverUpiId, 
      expenseId, 
      waiveFee, 
      settlementTier,
      type = "single",
      settlements = []
    } = body;

    const resolvedFromUserId = fromUserId || `member_${Date.now()}`;
    const isFree = Boolean(waiveFee || settlementTier === "free_ad");
    const isBatch = type === "batch" && Array.isArray(settlements) && settlements.length > 0;

    let baseAmount = 0;
    let paymentDescription = "";
    let primaryReceiverUpiId: string | undefined = receiverUpiId;
    let primaryReceiverName: string | undefined = toUserName;

    if (isBatch) {
      if (!groupId || settlements.length === 0) {
        return NextResponse.json({ error: "Invalid batch settlement parameters" }, { status: 400, headers: corsHeaders });
      }

      baseAmount = Number(settlements.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0).toFixed(2));
      if (baseAmount <= 0) {
        return NextResponse.json({ error: "Total batch settlement amount must be greater than zero" }, { status: 400, headers: corsHeaders });
      }

      paymentDescription = `Splinzo: Settle ${settlements.length} group dues (₹${baseAmount})`;
      // Pick first payee with UPI ID if available as primary fallback receiver
      const firstWithUpi = settlements.find((s: any) => s.receiverUpiId);
      if (firstWithUpi) {
        primaryReceiverUpiId = firstWithUpi.receiverUpiId;
        primaryReceiverName = firstWithUpi.toUserName;
      }
    } else {
      if (!groupId || !toUserId || !amount || Number(amount) <= 0) {
        return NextResponse.json({ error: "Invalid settlement parameters" }, { status: 400, headers: corsHeaders });
      }

      baseAmount = Number(Number(amount).toFixed(2));
      paymentDescription = `Splinzo: Settle ₹${baseAmount} with ${toUserName || "Friend"}`;
    }

    // Single ₹1 platform fee charged for the entire transaction (or ₹0 if free tier via ad)
    const platformFee = isFree ? 0 : PLATFORM_FEE;
    const totalAmount = Number((baseAmount + platformFee).toFixed(2));
    const amountInPaise = Math.round(totalAmount * 100);

    const db = getServerDb();

    // Unique payment ID (differentiated by batch prefix if batch)
    const paymentId = isBatch 
      ? `pay_batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      : `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const paymentRef = doc(db, "payments", paymentId);

    const savingsAmount = isBatch ? (settlements.length - 1) * PLATFORM_FEE : 0;

    // Save initial record in Firestore
    const initialPaymentData: Record<string, any> = {
      id: paymentId,
      groupId,
      fromUserId: resolvedFromUserId,
      fromUserName: fromUserName || "Member",
      amount: baseAmount,
      platformFee,
      totalAmount,
      type: isBatch ? "batch" : "single",
      feeTier: isFree ? "free_ad" : "instant",
      adWatched: isFree,
      status: "pending_approval",
      verifiedVia: isBatch ? "setu_batch" : "setu",
      createdAt: serverTimestamp(),
    };

    if (isBatch) {
      initialPaymentData.batchItems = settlements;
      initialPaymentData.savingsAmount = savingsAmount;
      initialPaymentData.toUserId = "multiple";
      initialPaymentData.toUserName = `${settlements.length} Members`;
    } else {
      initialPaymentData.toUserId = toUserId;
      initialPaymentData.toUserName = toUserName || "Member";
      initialPaymentData.expenseId = expenseId || "";
    }

    await setDoc(paymentRef, initialPaymentData);

    // Generate Setu Tracked UPI Deeplink (one link for the entire batch)
    const setuResponse = await setuClient.createPaymentLink({
      billerBillID: paymentId,
      amountInPaise,
      description: paymentDescription,
      receiverUpiId: primaryReceiverUpiId,
      receiverName: primaryReceiverName,
    });

    // Store setuLinkId on the payment doc
    await updateDoc(paymentRef, {
      setuLinkId: setuResponse.linkId,
    });

    return NextResponse.json(
      {
        success: true,
        paymentId,
        linkId: setuResponse.linkId,
        upiUrl: setuResponse.upiUrl,
        shortUrl: setuResponse.shortUrl,
        qrData: setuResponse.qrData || setuResponse.upiUrl,
        baseAmount,
        platformFee,
        totalAmount,
        type: isBatch ? "batch" : "single",
        batchItems: isBatch ? settlements : undefined,
        savingsAmount,
        feeTier: isFree ? "free_ad" : "instant",
        adWatched: isFree,
        isSimulated: setuResponse.isSimulated,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[/api/settle/create-link] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment link" },
      { status: 500, headers: corsHeaders }
    );
  }
}
