import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
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

export async function PATCH(req: NextRequest) {
  try {
    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500, headers: corsHeaders });
    }

    const body = await req.json();
    const { ticketId, status, priority, assignedTo } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required." }, { status: 400, headers: corsHeaders });
    }

    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    await db.collection("support_tickets").doc(ticketId).update(updateData);

    return NextResponse.json({ success: true, ticketId, updated: updateData }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[api/admin/tickets] Error updating ticket:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update ticket." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, isConfigured } = getFirebaseAdmin();
    if (!isConfigured || !db) {
      return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500, headers: corsHeaders });
    }

    const body = await req.json();
    const { ticketId, senderId, senderName, senderRole, content, isInternalNote } = body;

    if (!ticketId || !content) {
      return NextResponse.json({ error: "ticketId and content are required." }, { status: 400, headers: corsHeaders });
    }

    const msgRef = await db.collection("support_tickets").doc(ticketId).collection("messages").add({
      senderId: senderId || "staff-mobile",
      senderName: senderName || "Super Admin",
      senderRole: senderRole || "staff",
      content: content.trim(),
      isInternalNote: !!isInternalNote,
      createdAt: FieldValue.serverTimestamp(),
    });

    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!isInternalNote) {
      const isStaff = senderRole === "staff" || senderRole === "admin";
      updateData.lastReplyAt = FieldValue.serverTimestamp();
      updateData.lastReplyBy = isStaff ? "staff" : "user";
      updateData.status = isStaff ? "waiting_on_user" : "in_progress";
    }

    await db.collection("support_tickets").doc(ticketId).update(updateData);

    return NextResponse.json({ success: true, messageId: msgRef.id }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[api/admin/tickets] Error adding message:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add message to ticket." },
      { status: 500, headers: corsHeaders }
    );
  }
}
