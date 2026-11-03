import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { verifyStaffKey } from "@/lib/adminAuth";

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
        { error: "Firebase Admin is not configured.", groups: [] },
        { status: 500, headers: corsHeaders }
      );
    }

    const snap = await db.collection("groups").limit(100).get();

    const groups = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || "Untitled Group",
        memberIds: data.memberIds || [],
        members: data.members || [],
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(
      { success: true, count: groups.length, groups },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/groups] Error fetching groups:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch groups.", groups: [] },
      { status: 500, headers: corsHeaders }
    );
  }
}
