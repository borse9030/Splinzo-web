import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function debugPlans() {
  // Find group "spider"
  const q = query(collection(db, "groups"), where("name", "==", "spider"));
  const qs = await getDocs(q);
  if (qs.empty) {
    console.log("Group spider not found");
    return;
  }
  
  const groupDoc = qs.docs[0];
  console.log("Group ID:", groupDoc.id);
  console.log("Group Members:", JSON.stringify(groupDoc.data().members, null, 2));

  // Get trips
  const tripsQs = await getDocs(collection(db, "groups", groupDoc.id, "trips"));
  for (const trip of tripsQs.docs) {
    console.log("\nTrip ID:", trip.id, "Title:", trip.data().title);
    
    const plansQs = await getDocs(collection(db, "groups", groupDoc.id, "trips", trip.id, "plans"));
    plansQs.docs.forEach(plan => {
      console.log(`Plan ID: ${plan.id}, Title: ${plan.data().title}`);
      console.log("Raw Data:", JSON.stringify(plan.data(), null, 2));
    });
  }
}

debugPlans().catch(console.error);
