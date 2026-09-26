import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging, Messaging, MulticastMessage, BatchResponse } from "firebase-admin/messaging";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminMessaging: Messaging | null = null;

export function getRuntimeEnv(key: string): string {
  try {
    if (process.env[key]) return process.env[key]!.trim();
    const realProcessEnv = eval("process.env") as Record<string, string | undefined>;
    if (realProcessEnv && realProcessEnv[key]) {
      return realProcessEnv[key]!.trim();
    }
  } catch (_) {}
  return "";
}

export function getFirebaseAdmin(): { db: Firestore | null; messaging: Messaging | null; isConfigured: boolean } {
  if (adminDb && adminMessaging) {
    return { db: adminDb, messaging: adminMessaging, isConfigured: true };
  }

  const serviceAccountKey =
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT_KEY") ||
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT") ||
    getRuntimeEnv("FIREBASE_ADMIN_KEY") ||
    getRuntimeEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const privateKey = getRuntimeEnv("FIREBASE_PRIVATE_KEY");
  const clientEmail = getRuntimeEnv("FIREBASE_CLIENT_EMAIL");
  const projectId = getRuntimeEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") || "splinzo";

  if (serviceAccountKey) {
    try {
      let raw = serviceAccountKey.trim();
      if (!raw.startsWith("{")) {
        try {
          raw = Buffer.from(raw, "base64").toString("utf-8").trim();
        } catch (_) {}
      }
      const parsed = JSON.parse(raw);
      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      adminDb = getFirestore(adminApp);
      adminMessaging = getMessaging(adminApp);
      return { db: adminDb, messaging: adminMessaging, isConfigured: true };
    } catch (e) {
      console.error("[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  if (privateKey && clientEmail) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      adminDb = getFirestore(adminApp);
      adminMessaging = getMessaging(adminApp);
      return { db: adminDb, messaging: adminMessaging, isConfigured: true };
    } catch (e) {
      console.error("[firebaseAdmin] Failed to initialize with privateKey/clientEmail:", e);
    }
  }

  // If no service account credentials, DO NOT call initializeApp() without credentials
  // because that triggers Application Default Credentials (ADC) lookup which crashes on Vercel
  return { db: null, messaging: null, isConfigured: false };
}

export function hasFirebaseAdminCredentials(): boolean {
  return !!(
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT_KEY") ||
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT") ||
    getRuntimeEnv("FIREBASE_ADMIN_KEY") ||
    (getRuntimeEnv("FIREBASE_PRIVATE_KEY") && getRuntimeEnv("FIREBASE_CLIENT_EMAIL")) ||
    getRuntimeEnv("GOOGLE_APPLICATION_CREDENTIALS")
  );
}

export interface MulticastResult {
  totalTargeted: number;
  successCount: number;
  failureCount: number;
  staleTokens: string[];
  errorMessage?: string;
  isConfigured: boolean;
}

/**
 * Sends FCM notifications in batches of up to 500 (FCM limit per call)
 */
export async function sendMulticastChunked(
  tokens: string[],
  baseMessage: Omit<MulticastMessage, "tokens">
): Promise<MulticastResult> {
  const { messaging, isConfigured } = getFirebaseAdmin();
  const uniqueTokens = Array.from(new Set(tokens.filter((t) => t && t.trim().length > 0)));

  if (!isConfigured || !messaging) {
    console.warn("[firebaseAdmin] Firebase Admin credentials not set. Skipping FCM push.");
    return {
      totalTargeted: uniqueTokens.length,
      successCount: 0,
      failureCount: 0,
      staleTokens: [],
      errorMessage: "FCM credentials not configured on server (missing FIREBASE_SERVICE_ACCOUNT_KEY). Notifications saved to inboxes.",
      isConfigured: false,
    };
  }

  const chunkSize = 500;
  let successCount = 0;
  let failureCount = 0;
  let lastErrorMessage: string | undefined;
  const staleTokens: string[] = [];

  for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
    const chunk = uniqueTokens.slice(i, i + chunkSize);
    const message: MulticastMessage = {
      ...baseMessage,
      tokens: chunk,
    };

    try {
      const response: BatchResponse = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            staleTokens.push(chunk[idx]);
          } else {
            lastErrorMessage = resp.error.message;
          }
        }
      });
    } catch (err: any) {
      console.error(`[firebaseAdmin] Batch multicast error at offset ${i}:`, err);
      failureCount += chunk.length;
      lastErrorMessage = err?.message || String(err);
    }
  }

  return {
    totalTargeted: uniqueTokens.length,
    successCount,
    failureCount,
    staleTokens,
    errorMessage: lastErrorMessage,
    isConfigured: true,
  };
}

/**
 * Removes dead FCM tokens from Firestore users to keep database queries clean
 */
export async function pruneStaleTokens(staleTokens: string[]) {
  if (!staleTokens || staleTokens.length === 0) return;
  const { db } = getFirebaseAdmin();
  if (!db) return;
  try {
    const batches = [];
    for (const token of staleTokens) {
      const snap = await db.collection("users").where("fcmToken", "==", token).limit(5).get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.forEach((doc) => {
          batch.update(doc.ref, { fcmToken: FieldValue.delete() });
        });
        batches.push(batch.commit());
      }
    }
    await Promise.all(batches);
    console.log(`[firebaseAdmin] Successfully pruned ${staleTokens.length} stale FCM tokens.`);
  } catch (err) {
    console.error("[firebaseAdmin] Error pruning stale tokens:", err);
  }
}
