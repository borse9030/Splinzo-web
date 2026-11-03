import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ success: true, campaigns: [] }, { headers: corsHeaders });
    }

    const snap = await db
      .collection("notification_campaigns")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const campaigns = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
      };
    });

    return NextResponse.json({ success: true, campaigns }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[history/route] Error fetching campaigns:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load campaigns history" },
      { status: 500, headers: corsHeaders }
    );
  }
}
