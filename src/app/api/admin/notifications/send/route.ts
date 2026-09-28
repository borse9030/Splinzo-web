import { NextRequest, NextResponse } from "next/server";
import { sendMulticastChunked, pruneStaleTokens, hasFirebaseAdminCredentials, MulticastResult } from "@/lib/firebaseAdmin";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    function extractUserTokens(data: any): string[] {
      const tokens: string[] = [];
      if (data?.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) {
        tokens.push(data.fcmToken.trim());
      }
      if (Array.isArray(data?.fcmTokens)) {
        data.fcmTokens.forEach((t: any) => {
          if (typeof t === "string" && t.trim().length > 10) {
            tokens.push(t.trim());
          } else if (t?.token && typeof t.token === "string" && t.token.trim().length > 10) {
            tokens.push(t.token.trim());
          }
        });
      }
      return tokens;
    }

    // ── 1. RESOLVE RECIPIENTS BASED ON TARGET TYPE ──
    if (targetType === "test") {
      if (testFcmToken && testFcmToken.trim().length > 0) {
        targetTokens.push(testFcmToken.trim());
      }
      if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
        targetedUids.push(...targetUserIds);
        const docs = await Promise.all(
          targetUserIds.map((uid: string) => getDoc(doc(db, "users", uid)))
        );
        docs.forEach((uDoc) => {
          if (uDoc.exists()) {
            const uTokens = extractUserTokens(uDoc.data());
            targetTokens.push(...uTokens);
          }
        });
      }
      if (targetTokens.length === 0 && targetedUids.length === 0) {
        return NextResponse.json(
          { error: "No test device FCM token or target user provided. Please select a user or enter a token." },
          { status: 400, headers: corsHeaders }
        );
      }
    } else if (targetType === "all") {
      const snap = await getDocs(collection(db, "users"));
      snap.forEach((userDoc) => {
        targetedUids.push(userDoc.id);
        const uTokens = extractUserTokens(userDoc.data());
        if (uTokens.length > 0) {
          targetTokens.push(...uTokens);
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
          targetedUids.push(userDoc.id);
          const uTokens = extractUserTokens(userDoc.data());
          if (uTokens.length > 0) {
            targetTokens.push(...uTokens);
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
          targetedUids.push(userDoc.id);
          const uTokens = extractUserTokens(userDoc.data());
          if (uTokens.length > 0) {
            targetTokens.push(...uTokens);
          }
        }
      });
    }

    // Deduplicate tokens & uids
    targetTokens = Array.from(new Set(targetTokens));
    const uniqueUids = Array.from(new Set(targetedUids));

    if (uniqueUids.length === 0 && targetTokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No recipients or active devices found for the selected audience.",
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
        appLogo: "https://www.splinzo.in/logo.png",
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
          icon: "ic_notification",
          color: "#F9B912",
          defaultSound: true,
          defaultVibrateTimings: true,
          ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
        },
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: "https://www.splinzo.in/logo.png",
          badge: "https://www.splinzo.in/logo.png",
          ...(cleanImageUrl ? { image: cleanImageUrl } : {}),
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

    // ── 3. DISPATCH IN 500-TOKEN MULTICAST CHUNKS (IF TOKENS EXIST) ──
    let result: MulticastResult = {
      totalTargeted: targetTokens.length,
      successCount: 0,
      failureCount: 0,
      staleTokens: [],
      isConfigured: true,
      errorMessage: undefined,
    };

    if (targetTokens.length > 0) {
      result = await sendMulticastChunked(targetTokens, baseMessage);
      if (result.staleTokens.length > 0) {
        pruneStaleTokens(result.staleTokens).catch((err) =>
          console.error("[send/route] Prune tokens background error:", err)
        );
      }
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
        targetCount: uniqueUids.length || result.totalTargeted,
        successCount: result.successCount,
        pushCount: result.successCount,
        inboxCount: uniqueUids.length,
        failureCount: result.failureCount,
        openedCount: 0,
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

    // ── 5. RECORD IN-APP INBOX ENTRY (For all targeted users) ──
    if (uniqueUids.length > 0) {
      try {
        // Process in batches of 450 to stay well under Firestore's 500 operations per batch limit
        const CHUNK_SIZE = 450;
        for (let i = 0; i < uniqueUids.length; i += CHUNK_SIZE) {
          const chunk = uniqueUids.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((uid) => {
            const notifDoc = doc(collection(db, "users", uid, "notifications"));
            batch.set(notifDoc, {
              id: notifDoc.id,
              title: title.trim(),
              body: messageBody.trim(),
              imageUrl: cleanImageUrl || null,
              type: "admin_broadcast",
              bannerStyle: bannerStyle || "blinkit",
              actionType: actionType || "home",
              actionData: actionData || {},
              isRead: false,
              read: false,
              campaignId: campaignId || "",
              createdAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } catch (e) {
        console.warn("[send/route] Could not write inbox notifications:", e);
      }
    }

    const hasCreds = hasFirebaseAdminCredentials();
    const isSuccess = uniqueUids.length > 0 || (targetTokens.length > 0 && result.successCount > 0);

    return NextResponse.json(
      {
        success: isSuccess,
        campaignId,
        targeted: uniqueUids.length || result.totalTargeted,
        targetCount: uniqueUids.length || result.totalTargeted,
        successCount: result.successCount,
        pushCount: result.successCount,
        inboxCount: uniqueUids.length,
        failureCount: result.failureCount,
        staleTokensCount: result.staleTokens.length,
        errorMessage: result.errorMessage,
        error: !isSuccess ? (result.errorMessage || "Failed to deliver notifications.") : undefined,
        credentialsConfigured: hasCreds,
        inboxSaved: uniqueUids.length > 0,
        message: targetTokens.length > 0
          ? `Broadcast sent: ${result.successCount} hardware push alerts dispatched, ${uniqueUids.length} in-app Notification Centers updated.`
          : `Saved to ${uniqueUids.length} user Notification Centers. (Web & iPhone users will see this in their app Notification Center).`,
        warning: !hasCreds && targetTokens.length > 0
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
