import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { verifyStaffKey } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
        { error: "Firebase Admin is not configured." },
        { status: 500, headers: corsHeaders }
      );
    }

    const docSnap = await db.collection("app_config").doc("app_updates").get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { success: true, config: null },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, config: docSnap.data() },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/app-updates] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch app updates config." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured." },
        { status: 500, headers: corsHeaders }
      );
    }

    const payload = {
      ...body,
      latestVersionCode: Number(body.latestVersionCode),
      minSupportedVersionCode: Number(body.minSupportedVersionCode),
      updatedAt: new Date(),
    };

    await db.collection("app_config").doc("app_updates").set(payload, { merge: true });

    return NextResponse.json(
      { success: true, message: "App update configuration saved successfully.", config: payload },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/app-updates] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save update configuration." },
      { status: 500, headers: corsHeaders }
    );
  }
}

