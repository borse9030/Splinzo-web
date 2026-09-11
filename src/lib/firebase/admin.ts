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
      console.error("[firebase/admin] Failed to init with cert:", e);
    }
  }

  if (!adminApp) {
    try {
      const b64 = "eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InNwbGluem8iLCJwcml2YXRlX2tleV9pZCI6IjgxN2RjOTNmMjcyOWIyNDljNDMyYmExZGUzN2YzMmNiMGRlMGUwOTMiLCJwcml2YXRlX2tleSI6Ii0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDdjdLYW90NnU4VUlxWFxuUnA2eC91cFZxdEpaMmhpTUViNnd1RkdNUndvNGUrWTFmU0paWDQ1N3labjB6MHVqR3hOUFNTUXBWRElYUTR0bVxuZm9hY1F1bmhrYk13S2QrVU1jOVU3cVU5TzZMb01weEJ1VEF3T0NRMUpKeDNDd3A2SHZaOHYrbkxmaEhUeTFrbFxubEpXdnhKV1F5aWEyY3ZNbnpObmtwcHd1UTcyazR5VWQ1WWRYQmdHU3VlZGhZb0c4aVJhcmNIWEd5cDk3dmhnblxudGRNaGJ4TXo3RlF4dDhHTmlEMUMvN0x0K1NScWJWWkJ2ZkNPYjkxcHJlUGRwOXRxU3M3MFk4MEdNNDRwaDlrZ1xuaGN4bzVycjAzT1NEWmtvODZ0RnBuOGpPZUhwOFVqdjZFQkFyUnAwY3Qyb1Q2M0VEOVJPNjdIa0g3aytCQWRUaVxuK3FIZUViREpBZ01CQUFFQ2dnRUFVVm5FR1huUm91TzFxczEvdmZ5TW5TL0FWTWRyR1g1dEtTZ2FvWjBLSjJOM1xuNlYwam9LTjA3bDRqNE5abytoUWZva2JHdjR2TkcvL2lldk5nU09zU1h2b3ltNytKUVd5bEhQZThGbXc0NFZuaFxuOHV4eFVhTHNiMXl1TThnNXdJNEgybGtlZ2ppYWdzOWlPbVFTc2ZSY1cxZDNmbC82ZS9tWStzaG1xV2d1em90c1xuZTZiQ1Zzell5QVV1ZGVaUm84Mkpwek5ncWc5c3NCaWVwVm9KTTdsOUxCT05XclNhZ2FvdDFjcW9GTktIbHpnalxuTzR6RmFPM3NvMWlVcSs1SkNIb21nWGViK0JTMElCK05iUVltL3lvR1JFNFdwTzZYd09TbkJ6SEVhU21iY2ErSVxuU2QxTXNwbzBZU21ZdURTMlNsdjY2eCtydUJNdzNNY0RteDFxS0ZiRHh3S0JnUURndEo4Y3U1TlQya09KcWMrb1xucHdFWTUvMXF6T1NGNElEU0hmVmVqUnAyZnNvSnJPYnphWWJiWXBxKzJRSC9xaFJGM0lmVEx0SElrTHp6OW9lSlxuRVZhQ0p5KzFBeXk0VmFNYi9paFBxaE42dnJ6bm05eHoxN3JXcGVOa1ZUU3JaVFIxVXQ3OENSeXdUR1h1S2ZrWFxuSHdUODM3U0l1MnNoRUU5OEdFVVRUWE83RXdLQmdRREliTmlpb0FReURaUHFPWW1SZXJ5cEhwRG8xQlJYdll5N1xuTG5JRFlRZEQ1RmdWaXlXeTdPVEJIOXZzRjBaWnV4VlRVVTRsem5PczVIeWVFKzVna3lOSXVwNVJ2Q08ray9STlxuZExhUVl3L1crZXdVWVIxR2VXeDYyQklBT0xvdUl4Q3pKQU0rTmRqSjdXNmg2bTdYNjB2Z0c4RlY1SUtJRCs4S1xuc08yR3gxQmtNd0tCZ0czdUw0RmhDdnlVNVVHdC85ZWtqRmJnK0F1TjNhYlpaR3huRjZtQUlwZ2lBem1raXdBK1xuZWlsT0hpS01DL3hGK3RFS3lMQTZVWXRycytVdWtMUXY5VUNMWnoySkpoR3dZN0hJTDNSNTRqbkVvcW8waUM5c1xuTlEzWjdsc2hqRGpsdERwSnBxbHEwOHcwTkJIR0d3U0N1bS8wQ1dCelFEL1d1T3dlKzN3c0FoaGRBb0dBRUNqV1xuZnFZd01HanYyQjZ6Zk10TWtzWW9JTjJZbGtwdUlsbG9UK1Z1MUlhQW81d0llaGluaVBxc25LaHp2NkJaNDlIV1xuWHkzNkhhSitlYkJacytlcEhLQVBTNy9Ea2dZVDJIcmtqVmV2VzBIalN2RlpqdWtUV2dRNXoxTERrQnk3cC9YclxuWFFTeWFmVit5Z2RBMEova0NqbXlxTjQzdUFpdzJVZlNudDlMR0FrQ2dZRUF3emxsTlVHNmY5VFZ3dWIzNngxcVxua1E2Q3lnaVdNa1grcmZuOTBsZHdYWGRENU5US1MrbmlnclFjS3d0dXcrTXhsNFRFVFFFKzVnNVZVZGRYVG5FZVxuMWRtaHlmZFJKbEpJWXZHcXpJT1J1cTJreFRMcUJQV1dnUWpTd2VmTndvcGdtNHFEbkFYRnJkNGlORTlaQW11d1xuQTR6a3dETldRNW9qSzdrd3RzTHZvOEk9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLCJjbGllbnRfZW1haWwiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BzcGxpbnpvLmlhbS5nc2VydmljZWFjY291bnQuY29tIn0=";
      const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId,
      });
    } catch (e) {
      console.error("[firebase/admin] Failed to init with b64 fallback:", e);
      adminApp = initializeApp({ projectId });
    }
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

  return { app: adminApp, auth: adminAuth, db: adminDb };
}
