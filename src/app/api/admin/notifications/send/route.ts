import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, sendMulticastChunked, pruneStaleTokens, hasFirebaseAdminCredentials } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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
      title,
      body: messageBody,
      imageUrl,
      targetType = "all", // "all" | "users" | "group" | "test"
      targetUserIds = [],
      targetGroupId = "",
      testFcmToken = "",
      actionType = "home", // "home" | "group" | "expense" | "guilt_jar" | "url"
      actionData = {},
      bannerStyle = "blinkit", // "blinkit" | "water_duty" | "guilt_jar" | "celebration" | "standard"
      staffSession = { name: "Super Admin", email: "admin@splinzo.com" },
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Title and Body are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db } = getFirebaseAdmin();
    let targetTokens: string[] = [];
    const targetedUids: string[] = [];

    // ── 1. RESOLVE RECIPIENTS BASED ON TARGET TYPE ──
    if (targetType === "test") {
      if (testFcmToken && testFcmToken.trim().length > 0) {
        targetTokens.push(testFcmToken.trim());
      } else {
        return NextResponse.json(
          { error: "No test device FCM token provided. Please specify a test token or target user." },
          { status: 400, headers: corsHeaders }
        );
      }
    } else if (targetType === "all") {
      const snap = await db.collection("users").get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
          targetTokens.push(data.fcmToken.trim());
          targetedUids.push(doc.id);
        }
      });
    } else if (targetType === "users") {
      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return NextResponse.json(
          { error: "No users selected for targeting." },
          { status: 400, headers: corsHeaders }
        );
      }
      // Fetch in chunks of 30 for Firestore 'in' query or parallel get
      const docs = await Promise.all(
        targetUserIds.map((uid: string) => db.collection("users").doc(uid).get())
      );
      docs.forEach((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
            targetTokens.push(data.fcmToken.trim());
            targetedUids.push(doc.id);
          }
        }
      });
    } else if (targetType === "group") {
      if (!targetGroupId) {
        return NextResponse.json(
          { error: "Target Group ID is required." },
          { status: 400, headers: corsHeaders }
        );
      }
      const groupDoc = await db.collection("groups").doc(targetGroupId).get();
      if (!groupDoc.exists) {
        return NextResponse.json(
          { error: "Selected group does not exist." },
          { status: 404, headers: corsHeaders }
        );
      }
      const groupData = groupDoc.data() || {};
      let memberIds: string[] = [];
      if (Array.isArray(groupData.memberIds)) {
        memberIds = groupData.memberIds;
      } else if (Array.isArray(groupData.members)) {
        memberIds = groupData.members.map((m: any) => (typeof m === "string" ? m : m.id));
      }

      if (memberIds.length === 0) {
        return NextResponse.json(
          { error: "Group has no members." },
          { status: 400, headers: corsHeaders }
        );
      }

      const userDocs = await Promise.all(
        memberIds.map((uid) => db.collection("users").doc(uid).get())
      );
      userDocs.forEach((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
            targetTokens.push(data.fcmToken.trim());
            targetedUids.push(doc.id);
          }
        }
      });
    }

    // Deduplicate tokens
    targetTokens = Array.from(new Set(targetTokens));

    if (targetTokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active device tokens found for the selected audience.",
          targetedCount: 0,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // ── 2. PREPARE PAYLOAD ──
    const cleanImageUrl = imageUrl && imageUrl.trim().startsWith("http") ? imageUrl.trim() : undefined;

    const baseMessage = {
      notification: {
        title: title.trim(),
        body: messageBody.trim(),
        ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
      },
      data: {
        type: "admin_broadcast",
        bannerStyle: bannerStyle || "blinkit",
        actionType: actionType || "home",
        title: title.trim(),
        body: messageBody.trim(),
        imageUrl: cleanImageUrl || "",
        groupId: actionData?.groupId || "",
        expenseId: actionData?.expenseId || "",
        externalUrl: actionData?.externalUrl || "",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        timestamp: Date.now().toString(),
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "splinzo_general",
          priority: "high" as const,
          ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title: title.trim(),
              body: messageBody.trim(),
            },
            sound: "default",
            contentAvailable: true,
            ...(cleanImageUrl ? { "mutable-content": 1 } : {}),
          },
        },
        ...(cleanImageUrl ? { fcmOptions: { imageUrl: cleanImageUrl } } : {}),
      },
    };

    // ── 3. DISPATCH IN 500-TOKEN MULTICAST CHUNKS ──
    const result = await sendMulticastChunked(targetTokens, baseMessage);

    // Prune dead tokens in background asynchronously
    if (result.staleTokens.length > 0) {
      pruneStaleTokens(result.staleTokens).catch((err) =>
        console.error("[send/route] Prune tokens background error:", err)
      );
    }

    // ── 4. RECORD CAMPAIGN AUDIT LOG ──
    const campaignRef = await db.collection("notification_campaigns").add({
      title: title.trim(),
      body: messageBody.trim(),
      imageUrl: cleanImageUrl || null,
      targetType,
      targetGroupId: targetGroupId || null,
      targetCount: result.totalTargeted,
      successCount: result.successCount,
      failureCount: result.failureCount,
      actionType,
      actionData: actionData || {},
      bannerStyle,
      sentBy: staffSession,
      createdAt: FieldValue.serverTimestamp(),
    });

    // ── 5. RECORD IN-APP INBOX ENTRY (For targeted users) ──
    if (targetedUids.length > 0 && targetType !== "test") {
      // Save top 200 to inbox to prevent unbounded write limits
      const inboxUids = targetedUids.slice(0, 200);
      const batch = db.batch();
      inboxUids.forEach((uid) => {
        const notifDoc = db.collection("users").doc(uid).collection("notifications").doc();
        batch.set(notifDoc, {
          title: title.trim(),
          body: messageBody.trim(),
          imageUrl: cleanImageUrl || null,
          type: "admin_broadcast",
          bannerStyle,
          actionType,
          actionData: actionData || {},
          isRead: false,
          campaignId: campaignRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      batch.commit().catch((e) => console.error("[send/route] Error writing inbox notifications:", e));
    }

    const hasCreds = hasFirebaseAdminCredentials();

    return NextResponse.json(
      {
        success: result.successCount > 0,
        campaignId: campaignRef.id,
        targeted: result.totalTargeted,
        successCount: result.successCount,
        failureCount: result.failureCount,
        staleTokensCount: result.staleTokens.length,
        errorMessage: result.errorMessage,
        credentialsConfigured: hasCreds,
        warning: !hasCreds
          ? "Notice: Server environment is missing FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PRIVATE_KEY. Cloud Messaging requires a service account credential to reach remote user devices."
          : undefined,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[send/route] Fatal error sending notifications:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error dispatching notifications." },
      { status: 500, headers: corsHeaders }
    );
  }
}
