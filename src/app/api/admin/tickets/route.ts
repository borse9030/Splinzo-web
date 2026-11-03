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
    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured.", tickets: [] },
        { status: 500, headers: corsHeaders }
      );
    }

    const snap = await db
      .collection("support_tickets")
      .orderBy("updatedAt", "desc")
      .limit(100)
      .get()
      .catch(async () => {
        // Fallback without ordering in case index is not built
        return await db!.collection("support_tickets").limit(100).get();
      });

    const tickets = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    });

    return NextResponse.json(
      { success: true, count: tickets.length, tickets },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/tickets] Error fetching tickets:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch tickets.", tickets: [] },
      { status: 500, headers: corsHeaders }
    );
  }
}
