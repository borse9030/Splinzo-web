import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { verifyStaffKey, ADMIN_USERNAME } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passkey, username } = body;

    const cleanPass = (passkey || "").trim();
    const isSuperAdmin = verifyStaffKey(cleanPass);

    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured on server." },
        { status: 500, headers: corsHeaders }
      );
    }

    let uid = "adminsplinzo147";
    let role = "admin";
    let isSuper = true;

    if (isSuperAdmin) {
      uid = "adminsplinzo147";
      role = "admin";
      isSuper = true;

      // Ensure staff_members document exists for rule checks
      await db.collection("staff_members").doc(uid).set(
        {
          id: uid,
          name: "Super Admin",
          username: ADMIN_USERNAME,
          email: "admin@splinzo.in",
          role: "super_admin",
          isSuperAdmin: true,
          isActive: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } else if (username && cleanPass) {
      // Check created staff members
      const cleanUser = username.trim().toLowerCase();
      const snap = await db.collection("staff_members").where("username", "==", cleanUser).limit(1).get();
      if (snap.empty || snap.docs[0].data().password !== cleanPass) {
        return NextResponse.json(
          { error: "Invalid staff credentials." },
          { status: 401, headers: corsHeaders }
        );
      }
      const staffDoc = snap.docs[0];
      const data = staffDoc.data();
      if (data.isActive === false) {
        return NextResponse.json(
          { error: "Staff account is disabled. Contact super admin." },
          { status: 403, headers: corsHeaders }
        );
      }
      uid = staffDoc.id;
      role = "support_staff";
      isSuper = false;
    } else {
      return NextResponse.json(
        { error: "Invalid or missing credentials." },
        { status: 401, headers: corsHeaders }
      );
    }

    const { getApps } = await import("firebase-admin/app");
    const adminApp = getApps()[0];
    const customToken = await getAuth(adminApp).createCustomToken(uid, {
      role,
      isSuperAdmin: isSuper,
    });

    return NextResponse.json(
      {
        success: true,
        token: customToken,
        uid,
        role,
        isSuperAdmin: isSuper,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/auth/token] Error generating custom token:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to authenticate admin session." },
      { status: 500, headers: corsHeaders }
    );
  }
}

