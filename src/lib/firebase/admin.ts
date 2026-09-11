import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

export function getFirebaseAdmin(): { app: App; auth: Auth; db: Firestore } {
  if (adminApp && adminAuth && adminDb) {
    return { app: adminApp, auth: adminAuth, db: adminDb };
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return { app: adminApp, auth: adminAuth, db: adminDb };
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "splinzo";

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId,
      });
    } catch (e) {
      console.error("[firebase/admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  if (!adminApp && privateKey && clientEmail) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } catch (e) {
      console.error("[firebase/admin] Failed to init with privateKey/clientEmail:", e);
    }
  }

  if (!adminApp) {
    // Fallback initialize
    adminApp = initializeApp({ projectId });
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

  return { app: adminApp, auth: adminAuth, db: adminDb };
}
