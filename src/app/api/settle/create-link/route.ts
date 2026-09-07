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
    const { groupId, fromUserId, fromUserName, toUserId, toUserName, amount, receiverUpiId, expenseId } = body;

    const resolvedFromUserId = fromUserId || `member_${Date.now()}`;

    if (!groupId || !toUserId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid settlement parameters" }, { status: 400, headers: corsHeaders });
    }

    const baseAmount = Number(amount);
    const platformFee = PLATFORM_FEE;
    const totalAmount = Number((baseAmount + platformFee).toFixed(2));
    const amountInPaise = Math.round(totalAmount * 100);

    const db = getServerDb();

    // Unique payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentRef = doc(db, "payments", paymentId);

    // Save initial record in Firestore
    await setDoc(paymentRef, {
      id: paymentId,
      groupId,
      fromUserId: resolvedFromUserId,
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
