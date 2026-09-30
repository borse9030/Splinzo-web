import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/serverDb";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { setuClient } from "@/lib/fintech/setuClient";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

/**
 * Approves the payment and, if it was a batch settlement, unpacks each child settlement
 * so that group balances are automatically cleared for all creditors simultaneously.
 */
async function approvePaymentAndUnpackBatch(
  db: any,
  paymentRef: any,
  payment: any,
  utr: string,
  verifiedVia: string = "setu"
) {
  await updateDoc(paymentRef, {
    status: "approved",
    approvedAt: serverTimestamp(),
    utr,
    verifiedVia,
  });

  // Auto-stop active reminders for single payment
  if (payment.groupId && payment.fromUserId && payment.toUserId) {
    try {
      const { reminderService } = await import("@/services/reminderService");
      await reminderService.autoStopReminders(payment.groupId, payment.fromUserId, payment.toUserId, payment.id);
    } catch (_) {}
  }

  // If this was a batch settlement, create approved child payment records for each individual creditor
  if (payment.type === "batch" && Array.isArray(payment.batchItems)) {
    for (const item of payment.batchItems) {
      const childPaymentId = `pay_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const childRef = doc(db, "payments", childPaymentId);
      await setDoc(childRef, {
        id: childPaymentId,
        groupId: payment.groupId,
        fromUserId: payment.fromUserId,
        fromUserName: payment.fromUserName,
        toUserId: item.toUserId,
        toUserName: item.toUserName,
        amount: Number(item.amount),
        platformFee: 0, // already covered by master batch fee
        totalAmount: Number(item.amount),
        status: "approved",
        approvedAt: serverTimestamp(),
        utr,
        batchMasterId: payment.id,
        verifiedVia: `${verifiedVia}_child`,
        createdAt: serverTimestamp(),
      });

      // Auto-stop reminder for each batch item creditor
      try {
        const { reminderService } = await import("@/services/reminderService");
        await reminderService.autoStopReminders(payment.groupId, payment.fromUserId, item.toUserId, childPaymentId);
      } catch (_) {}
    }
  }
}

// Short-circuit in-memory cache to prevent redundant external Setu API hits and Firestore reads
interface PaymentStatusCacheEntry {
  status: "PAID" | "PENDING";
  utr?: string;
  approvedAt?: any;
  cachedAt: number;
}

const statusCache = new Map<string, PaymentStatusCacheEntry>();
const PENDING_CACHE_TTL_MS = 3500; // 3.5 seconds for pending status
const PAID_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for paid status

function cleanExpiredStatusCache() {
  const now = Date.now();
  for (const [key, entry] of statusCache.entries()) {
    const ttl = entry.status === "PAID" ? PAID_CACHE_TTL_MS : PENDING_CACHE_TTL_MS;
    if (now - entry.cachedAt > ttl) {
      statusCache.delete(key);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const linkId = searchParams.get("linkId");

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400, headers: corsHeaders });
    }

    // 1. Check in-memory short-circuit cache
    cleanExpiredStatusCache();
    const cacheKey = `${paymentId}_${linkId || ""}`;
    const cached = statusCache.get(cacheKey);
    const now = Date.now();
    if (cached) {
      const ttl = cached.status === "PAID" ? PAID_CACHE_TTL_MS : PENDING_CACHE_TTL_MS;
      if (now - cached.cachedAt < ttl) {
        if (cached.status === "PAID") {
          return NextResponse.json(
            {
              status: "PAID",
              utr: cached.utr || "BANK_VERIFIED",
              approvedAt: cached.approvedAt,
              fromCache: true,
            },
            { headers: corsHeaders }
          );
        } else {
          return NextResponse.json({ status: "PENDING", fromCache: true }, { headers: corsHeaders });
        }
      }
    }

    const db = getServerDb();
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404, headers: corsHeaders });
    }

    const payment = paymentSnap.data();

    // If already approved (e.g. via webhook or previous poll)
    if (payment.status === "approved") {
      const utr = payment.utr || "BANK_VERIFIED";
      statusCache.set(cacheKey, {
        status: "PAID",
        utr,
        approvedAt: payment.approvedAt,
        cachedAt: Date.now(),
      });

      return NextResponse.json(
        {
          status: "PAID",
          utr,
          approvedAt: payment.approvedAt,
        },
        { headers: corsHeaders }
      );
    }

    if (payment.status === "declined") {
      return NextResponse.json(
        {
          status: "DECLINED",
          declinedAt: payment.declinedAt,
        },
        { headers: corsHeaders }
      );
    }

    // Check Setu directly ONLY if it is a paid Setu link and not a free P2P UPI session
    if (linkId && !linkId.startsWith("free_upi_")) {
      const setuStatus = await setuClient.checkPaymentStatus(linkId);
      if (setuStatus.status === "PAID") {
        const utr = setuStatus.utr || `UPI${Date.now()}`;
        await approvePaymentAndUnpackBatch(db, paymentRef, payment, utr, "setu_polling");

        statusCache.set(cacheKey, {
          status: "PAID",
          utr,
          cachedAt: Date.now(),
        });

        return NextResponse.json(
          {
            status: "PAID",
            utr,
          },
          { headers: corsHeaders }
        );
      }
    }

    // Cache the PENDING response for 3.5 seconds to throttle rapid polling
    statusCache.set(cacheKey, {
      status: "PENDING",
      cachedAt: Date.now(),
    });

    return NextResponse.json({ status: "PENDING" }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[/api/settle/status] Error:", err);
    return NextResponse.json({ error: err.message || "Status check failed" }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Endpoint for confirming direct P2P payments or sandbox simulation
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentId, simulateSuccess, confirmDirectPayment, utr } = await req.json();
    if (!paymentId || (!simulateSuccess && !confirmDirectPayment)) {
      return NextResponse.json({ error: "Invalid confirmation request" }, { status: 400, headers: corsHeaders });
    }

    const db = getServerDb();
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404, headers: corsHeaders });
    }

    const payment = paymentSnap.data();
    const resolvedUtr = utr && typeof utr === "string" && utr.trim().length > 0
      ? utr.trim()
      : (confirmDirectPayment
          ? `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`
          : `SIM${Math.floor(100000000000 + Math.random() * 900000000000)}`);

    const verificationTag = confirmDirectPayment ? "direct_upi_free" : "setu_simulation";

    await approvePaymentAndUnpackBatch(db, paymentRef, payment, resolvedUtr, verificationTag);

    // Invalidate/update cache so polling clients immediately get PAID without waiting
    for (const [key] of statusCache.entries()) {
      if (key.startsWith(paymentId)) {
        statusCache.set(key, {
          status: "PAID",
          utr: resolvedUtr,
          cachedAt: Date.now(),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        status: "PAID",
        utr: resolvedUtr,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
