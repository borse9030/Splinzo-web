import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/serverDb";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, notificationId, userId } = body;

    const db = getServerDb();

    // 1. Mark in-app notification doc as read
    if (userId && notificationId) {
      try {
        const notifRef = doc(db, "users", userId, "notifications", notificationId);
        await updateDoc(notifRef, {
          isRead: true,
          read: true,
          openedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("[track/route] Error updating notification read state:", err);
      }
    }

    // 2. Increment campaign opened counter
    if (campaignId) {
      try {
        const campaignRef = doc(db, "notification_campaigns", campaignId);
        await updateDoc(campaignRef, {
          openedCount: increment(1),
        });
      } catch (err) {
        console.warn("[track/route] Error incrementing campaign openedCount:", err);
      }
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[track/route] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to track notification interaction" },
      { status: 500, headers: corsHeaders }
    );
  }
}
