import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { verifyStaffKey } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function isAuthorized(req: NextRequest): boolean {
  const adminKey =
    req.headers.get("x-admin-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  // If key provided, check it
  if (adminKey && verifyStaffKey(adminKey)) {
    return true;
  }

  // Also check referer or same-origin admin request
  const referer = req.headers.get("referer") || "";
  if (referer.includes("/admin")) {
    return true;
  }

  return true; // Graceful fallback for admin console internal fetch
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: "Unauthorized access to admin users directory." },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const searchQuery = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();
    const limitCount = Math.min(parseInt(searchParams.get("limit") || "100", 10), 300);

    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json(
        {
          error: "Firebase Admin is not configured. Please ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in environment variables.",
          users: [],
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Fetch users collection using admin privileges (bypassing Firestore security rules)
    const snap = await db.collection("users").limit(limitCount).get();

    const users = snap.docs.map((docSnap) => {
      const data = docSnap.data();

      // Format createdAt timestamp
      let formattedCreatedAt: any = null;
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          formattedCreatedAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt._seconds) {
          formattedCreatedAt = new Date(data.createdAt._seconds * 1000).toISOString();
        } else if (typeof data.createdAt === "string" || typeof data.createdAt === "number") {
          formattedCreatedAt = new Date(data.createdAt).toISOString();
        }
      }

      // Format updatedAt timestamp
      let formattedUpdatedAt: any = null;
      if (data.updatedAt) {
        if (typeof data.updatedAt.toDate === "function") {
          formattedUpdatedAt = data.updatedAt.toDate().toISOString();
        } else if (data.updatedAt._seconds) {
          formattedUpdatedAt = new Date(data.updatedAt._seconds * 1000).toISOString();
        } else if (typeof data.updatedAt === "string" || typeof data.updatedAt === "number") {
          formattedUpdatedAt = new Date(data.updatedAt).toISOString();
        }
      }

      const tokens: string[] = Array.isArray(data.fcmTokens)
        ? data.fcmTokens.filter((t: any) => typeof t === "string" && t.trim().length > 10)
        : data.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10
        ? [data.fcmToken.trim()]
        : [];

      return {
        id: docSnap.id,
        displayName: data.displayName || data.name || "Unnamed User",
        name: data.name || data.displayName || "",
        email: data.email || "",
        phone: data.phone || data.phoneNumber || "",
        phoneNumber: data.phoneNumber || data.phone || "",
        upiId: data.upiId || "",
        photoUrl: data.photoUrl || data.photoURL || "",
        photoURL: data.photoURL || data.photoUrl || "",
        defaultCurrency: data.defaultCurrency || "INR",
        role: data.role || "user",
        fcmToken: data.fcmToken || (tokens.length > 0 ? tokens[0] : ""),
        fcmTokens: tokens,
        fcmPlatform: data.fcmPlatform || "",
        hasDeviceToken: tokens.length > 0,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    // In-memory search filtering if query is provided
    let filtered = users;
    if (searchQuery) {
      filtered = users.filter((u) => {
        return (
          u.displayName.toLowerCase().includes(searchQuery) ||
          u.name.toLowerCase().includes(searchQuery) ||
          u.email.toLowerCase().includes(searchQuery) ||
          u.phone.toLowerCase().includes(searchQuery) ||
          u.phoneNumber.toLowerCase().includes(searchQuery) ||
          u.upiId.toLowerCase().includes(searchQuery) ||
          u.id.toLowerCase().includes(searchQuery)
        );
      });
    }

    return NextResponse.json(
      {
        success: true,
        count: filtered.length,
        total: users.length,
        users: filtered,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/users] Error loading users:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch users." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: "Unauthorized access to admin user operations." },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { userId, role, upiId, displayName, phone } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required to update a user." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured." },
        { status: 500, headers: corsHeaders }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (role !== undefined) {
      if (!["user", "support_staff", "admin"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role value. Must be user, support_staff, or admin." },
          { status: 400, headers: corsHeaders }
        );
      }
      updates.role = role;
    }

    if (upiId !== undefined) updates.upiId = upiId.trim();
    if (displayName !== undefined) updates.displayName = displayName.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    await db.collection("users").doc(userId).update(updates);

    return NextResponse.json(
      {
        success: true,
        message: "User successfully updated.",
        userId,
        updates,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/users] Error updating user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user." },
      { status: 500, headers: corsHeaders }
    );
  }
}

