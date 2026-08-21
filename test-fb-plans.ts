
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const groupId = "soCVIhdkua21rRhdPd9g";
  // The first trip ID from the previous run was "EIzyh6ClEMKwdDECAbMF"
  const tripId = "EIzyh6ClEMKwdDECAbMF";
  
  // Try "plans" subcollection
  const plansRef = collection(db, "groups", groupId, "trips", tripId, "plans");
  const plansSnap = await getDocs(plansRef);
  console.log("Found plans in trips/tripId/plans:", plansSnap.docs.length);
  plansSnap.forEach(d => console.log(d.id, d.data()));

  // Try "itinerary" subcollection
  const itinRef = collection(db, "groups", groupId, "trips", tripId, "itinerary");
  const itinSnap = await getDocs(itinRef);
  console.log("Found itinerary in trips/tripId/itinerary:", itinSnap.docs.length);
  itinSnap.forEach(d => console.log(d.id, d.data()));

  // Try checking the other trip in the screenshot just in case
  const tripsRef = collection(db, "groups", groupId, "trips");
  const tripsSnap = await getDocs(tripsRef);
  console.log("\nAll trips:");
  for (const t of tripsSnap.docs) {
    console.log("- " + t.id);
    const pRef = collection(db, "groups", groupId, "trips", t.id, "plans");
    const pSnap = await getDocs(pRef);
    if (pSnap.docs.length > 0) {
      console.log("  Found plans for trip", t.id);
      pSnap.forEach(d => console.log("   ", d.id, d.data()));
    }
  }
}
main().catch(console.error);
