import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { StaffMember } from "@/types/staff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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
        { error: "Firebase Admin is not configured.", staff: [] },
        { status: 500, headers: corsHeaders }
      );
    }

    const snap = await db.collection("staff_members").orderBy("createdAt", "desc").get().catch(async () => {
      return await db!.collection("staff_members").get();
    });

    const staff: StaffMember[] = snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
    })) as StaffMember[];

    return NextResponse.json({ success: true, staff }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[api/admin/staff] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch staff members.", staff: [] },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password, department, departmentLabel, createdBy } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Name, username, and password are required." },
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

    const cleanUser = username.trim().toLowerCase();
    const existing = await db.collection("staff_members").where("username", "==", cleanUser).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "A staff member with this username already exists." },
        { status: 400, headers: corsHeaders }
      );
    }

    const newDoc = db.collection("staff_members").doc();
    const staffData = {
      id: newDoc.id,
      name: name.trim(),
      username: cleanUser,
      email: (email || "").trim(),
      password: password.trim(),
      department: department || "all",
      departmentLabel: departmentLabel || "All Departments",
      role: "support_staff",
      isActive: true,
      assignedCount: 0,
      resolvedCount: 0,
      createdAt: new Date(),
      createdBy: createdBy || "Super Admin",
    };

    await newDoc.set(staffData);

    return NextResponse.json(
      { success: true, message: "Staff member created successfully.", staff: staffData },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[api/admin/staff] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create staff member." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, password } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff id is required." }, { status: 400, headers: corsHeaders });
    }

    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500, headers: corsHeaders });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (password && typeof password === "string") updates.password = password.trim();

    await db.collection("staff_members").doc(id).update(updates);

    return NextResponse.json({ success: true, message: "Staff updated successfully.", id }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[api/admin/staff] PATCH error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update staff member." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff id is required." }, { status: 400, headers: corsHeaders });
    }

    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500, headers: corsHeaders });
    }

    await db.collection("staff_members").doc(id).delete();

    return NextResponse.json({ success: true, message: "Staff member deleted successfully." }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[api/admin/staff] DELETE error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete staff member." },
      { status: 500, headers: corsHeaders }
    );
  }
}
