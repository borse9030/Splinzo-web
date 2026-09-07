import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin safely singleton
function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return {
      db: getFirestore(),
      messaging: getMessaging(),
    };
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "splinzo";

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(parsed),
        projectId,
      });
      return {
        db: getFirestore(),
        messaging: getMessaging(),
      };
    } catch (e) {
      console.error("[notify/route] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  if (privateKey && clientEmail) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      return {
        db: getFirestore(),
        messaging: getMessaging(),
      };
    } catch (e) {
      console.error("[notify/route] Failed to initialize with privateKey/clientEmail:", e);
    }
  }

  // Fallback to default application credentials
  try {
    initializeApp({
      projectId,
    });
  } catch (e) {
    console.warn("[notify/route] initializeApp() fallback notice:", e);
  }

  return {
    db: getFirestore(),
    messaging: getMessaging(),
  };
}

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
    const {
      groupId,
      callId,
      callerId,
      callerName,
      groupName,
      avatar,
      action = "call",
    } = body;

    if (!groupId || !callId) {
      return NextResponse.json(
        { error: "Missing groupId or callId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db, messaging } = getFirebaseAdmin();

    // 1. Fetch group members
    const groupDoc = await db.collection("groups").doc(groupId).get();
    if (!groupDoc.exists) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const groupData = groupDoc.data() || {};
    let targetMemberIds: string[] = [];

    if (Array.isArray(groupData.memberIds)) {
      targetMemberIds = groupData.memberIds;
    } else if (Array.isArray(groupData.members)) {
      targetMemberIds = groupData.members.map((m: any) =>
        typeof m === "string" ? m : m.id
      );
    }

    // Exclude caller from receiving incoming call push to their own phone
    targetMemberIds = targetMemberIds.filter((id) => id && id !== callerId);

    if (targetMemberIds.length === 0) {
      return NextResponse.json(
        { success: true, message: "No other members to notify" },
        { headers: corsHeaders }
      );
    }

    // 2. Fetch FCM tokens for target members
    const userDocs = await Promise.all(
      targetMemberIds.map((uid) => db.collection("users").doc(uid).get())
    );

    const tokens: string[] = [];
    userDocs.forEach((doc: any) => {
      if (doc.exists) {
        const token = doc.data()?.fcmToken;
        if (token && typeof token === "string" && token.trim().length > 0) {
          tokens.push(token.trim());
        }
      }
    });

    if (tokens.length === 0) {
      console.log(`[FCM Notify] Group ${groupId} members have no registered FCM tokens.`);
      return NextResponse.json(
        { success: true, message: "No registered FCM tokens found for members" },
        { headers: corsHeaders }
      );
    }

    // 3. Dispatch high-priority data message
    if (action === "call") {
      const response = await messaging.sendEachForMulticast({
        tokens,
        data: {
          type: "call",
          groupId,
          callId,
          callerId: callerId || "",
          callerName: callerName || "Someone",
          groupName: groupName || "Group Call",
          avatar: avatar || "",
        },
        android: {
          priority: "high",
          ttl: 45 * 1000, // 45 seconds ringing expiry
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-expiration": `${Math.floor(Date.now() / 1000) + 45}`,
          },
          payload: {
            aps: {
              contentAvailable: true,
              sound: "ring.mp3",
            },
          },
        },
      });

      console.log(`[FCM Call] Sent call invite to ${response.successCount}/${tokens.length} devices.`);
      return NextResponse.json(
        {
          success: true,
          action: "call",
          successCount: response.successCount,
          total: tokens.length,
        },
        { headers: corsHeaders }
      );
    } else if (action === "call_ended") {
      const response = await messaging.sendEachForMulticast({
        tokens,
        data: {
          type: "call_ended",
          groupId,
          callId,
        },
        android: {
          priority: "high",
          ttl: 15 * 1000,
        },
      });

      console.log(`[FCM Call] Sent call_ended to ${response.successCount}/${tokens.length} devices.`);
      return NextResponse.json(
        {
          success: true,
          action: "call_ended",
          successCount: response.successCount,
          total: tokens.length,
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "Unsupported action" },
      { status: 400, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[FCM Notify API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch notification" },
      { status: 500, headers: corsHeaders }
    );
  }
}
