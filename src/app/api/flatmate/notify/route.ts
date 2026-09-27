import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
      console.error("[flatmate/notify] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
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
      console.error("[flatmate/notify] Failed to initialize with privateKey/clientEmail:", e);
    }
  }

  try {
    initializeApp({
      projectId,
    });
  } catch (e) {
    console.warn("[flatmate/notify] initializeApp() fallback notice:", e);
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
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientUserIds,
      userIds,
      title,
      body: messageBody,
      type = "flat_hq",
      groupId,
      groupName = "Flat HQ",
      data = {},
    } = body;

    const targetUserIds: string[] = (recipientUserIds || userIds || []) as string[];

    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return NextResponse.json(
        { error: "recipientUserIds or userIds array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { db, messaging } = getFirebaseAdmin();

    // 1. Write notification records to each recipient's in-app collection: users/{uid}/notifications
    const batch = db.batch();
    const tokens: string[] = [];

    await Promise.all(
      targetUserIds.map(async (uid: string) => {
        if (!uid) return;

        // In-app notification doc
        const notifRef = db.collection("users").doc(uid).collection("notifications").doc();
        batch.set(notifRef, {
          id: notifRef.id,
          title,
          body: messageBody,
          type,
          groupId: groupId || "",
          groupName,
          data: data || {},
          read: false,
          isRead: false,
          actionType: type === "expense" ? "expense" : (groupId ? "group" : "home"),
          actionData: { groupId: groupId || "", expenseId: data?.expenseId || "" },
          createdAt: FieldValue.serverTimestamp(),
        });

        // Fetch user FCM token(s) and verify notification preferences
        try {
          const userDoc = await db.collection("users").doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const prefs = userData?.notificationPreferences;

            // Check if user disabled this category
            let isAllowed = true;
            if (prefs) {
              if ((type.startsWith("water") || type === "chore" || type === "duty_swap" || type === "flat_hq") && prefs.chores === false) {
                isAllowed = false;
              } else if (type === "expense" && prefs.expenses === false) {
                isAllowed = false;
              } else if (type === "broadcast" && prefs.broadcasts === false) {
                isAllowed = false;
              }
            }

            if (isAllowed) {
              const token = userData?.fcmToken;
              if (token && typeof token === "string" && token.trim().length > 10) {
                tokens.push(token.trim());
              }
              if (Array.isArray(userData?.fcmTokens)) {
                userData.fcmTokens.forEach((t: any) => {
                  if (typeof t === "string" && t.trim().length > 10) {
                    tokens.push(t.trim());
                  } else if (t?.token && typeof t.token === "string" && t.token.trim().length > 10) {
                    tokens.push(t.token.trim());
                  }
                });
              }
            }
          }
        } catch (err) {
          console.warn(`[flatmate/notify] Failed to fetch token for user ${uid}:`, err);
        }
      })
    );

    // Commit in-app notifications batch
    try {
      await batch.commit();
    } catch (batchErr) {
      console.error("[flatmate/notify] Error writing in-app notifications batch:", batchErr);
    }

    // 2. Dispatch FCM Push Notifications if tokens exist
    const uniqueTokens = Array.from(new Set(tokens.filter((t) => t && typeof t === "string" && t.trim().length > 10)));
    let fcmSentCount = 0;
    if (uniqueTokens.length > 0) {
      try {
        const payloadData = {
          type,
          groupId: groupId || "",
          groupName,
          appLogo: "https://www.splinzo.in/logo.png",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          ...Object.fromEntries(
            Object.entries(data || {}).map(([k, v]) => [k, String(v)])
          ),
        };

        const isFlatHq = type.startsWith("water") || type === "chore" || type === "flat_hq" || type === "guilt_jar";
        const channelId = isFlatHq ? "flat_hq_reminders" : "splinzo_default";

        const response = await messaging.sendEachForMulticast({
          tokens: uniqueTokens,
          notification: {
            title,
            body: messageBody,
          },
          data: payloadData,
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId,
              icon: "ic_notification",
              color: "#F9B912",
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
          webpush: {
            headers: {
              Urgency: "high",
            },
            notification: {
              icon: "https://www.splinzo.in/logo.png",
              badge: "https://www.splinzo.in/logo.png",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        });

        fcmSentCount = response.successCount;
        console.log(
          `[flatmate/notify] FCM Sent: ${response.successCount}/${tokens.length} successful.`
        );
      } catch (fcmErr) {
        console.error("[flatmate/notify] FCM send error:", fcmErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        recipientsNotified: targetUserIds.length,
        targeted: targetUserIds.length,
        targetCount: targetUserIds.length,
        successCount: fcmSentCount,
        fcmPushesSent: fcmSentCount,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[flatmate/notify] Unhandled error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch notification" },
      { status: 500, headers: corsHeaders }
    );
  }
}
