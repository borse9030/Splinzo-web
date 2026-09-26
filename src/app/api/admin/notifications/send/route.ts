import { NextRequest, NextResponse } from "next/server";
import { sendMulticastChunked, pruneStaleTokens, hasFirebaseAdminCredentials } from "@/lib/firebaseAdmin";
import { getServerDb } from "@/lib/firebase/serverDb";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

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

    const db = getServerDb();
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
      const snap = await getDocs(collection(db, "users"));
      snap.forEach((userDoc) => {
        const data = userDoc.data();
        if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
          targetTokens.push(data.fcmToken.trim());
          targetedUids.push(userDoc.id);
        }
      });
    } else if (targetType === "users") {
      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return NextResponse.json(
          { error: "No users selected for targeting." },
          { status: 400, headers: corsHeaders }
        );
      }
      const docs = await Promise.all(
        targetUserIds.map((uid: string) => getDoc(doc(db, "users", uid)))
      );
      docs.forEach((userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
            targetTokens.push(data.fcmToken.trim());
            targetedUids.push(userDoc.id);
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
      const groupDoc = await getDoc(doc(db, "groups", targetGroupId));
      if (!groupDoc.exists()) {
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
        memberIds.map((uid) => getDoc(doc(db, "users", uid)))
      );
      userDocs.forEach((userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
            targetTokens.push(data.fcmToken.trim());
            targetedUids.push(userDoc.id);
          }
        }
      });
    }

    // Deduplicate tokens
    targetTokens = Array.from(new Set(targetTokens));

    if (targetTokens.length === 0 && targetType !== "test") {
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

    // Prune dead tokens in background asynchronously if any
    if (result.staleTokens.length > 0) {
      pruneStaleTokens(result.staleTokens).catch((err) =>
        console.error("[send/route] Prune tokens background error:", err)
      );
    }

    // ── 4. RECORD CAMPAIGN AUDIT LOG ──
    let campaignId = "";
    try {
      const campaignRef = await addDoc(collection(db, "notification_campaigns"), {
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
        createdAt: serverTimestamp(),
      });
      campaignId = campaignRef.id;
    } catch (e) {
      console.warn("[send/route] Could not write to notification_campaigns:", e);
    }

    // ── 5. RECORD IN-APP INBOX ENTRY (For targeted users) ──
    if (targetedUids.length > 0 && targetType !== "test") {
      try {
        const inboxUids = targetedUids.slice(0, 200);
        const batch = writeBatch(db);
        inboxUids.forEach((uid) => {
          const notifDoc = doc(collection(db, "users", uid, "notifications"));
          batch.set(notifDoc, {
            title: title.trim(),
            body: messageBody.trim(),
            imageUrl: cleanImageUrl || null,
            type: "admin_broadcast",
            bannerStyle,
            actionType,
            actionData: actionData || {},
            isRead: false,
            campaignId: campaignId || "",
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      } catch (e) {
        console.warn("[send/route] Could not write inbox notifications:", e);
      }
    }

    const hasCreds = hasFirebaseAdminCredentials();

    return NextResponse.json(
      {
        success: hasCreds ? result.successCount > 0 : true,
        campaignId,
        targeted: result.totalTargeted,
        successCount: result.successCount,
        failureCount: result.failureCount,
        staleTokensCount: result.staleTokens.length,
        errorMessage: result.errorMessage,
        credentialsConfigured: hasCreds,
        inboxSaved: targetedUids.length > 0,
        warning: !hasCreds
          ? "Notice: Server environment is missing FIREBASE_SERVICE_ACCOUNT_KEY in Vercel. Notifications have been saved to user inboxes, but background hardware push alerts require this key."
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
