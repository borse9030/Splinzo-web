import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { db } = getFirebaseAdmin();
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
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
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
