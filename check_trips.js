const fs = require('fs');

async function check() {
  const code = `
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  // Try to use the .env.local vars by reading them
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
  const tripsRef = collection(db, "groups", groupId, "trips");
  const tripsSnap = await getDocs(tripsRef);
  console.log("Found trips in groups/groupId/trips:", tripsSnap.docs.length);
  tripsSnap.forEach(d => console.log(d.id, d.data()));
  
  // also check root trips
  const rootTripsRef = collection(db, "trips");
  const rootTripsSnap = await getDocs(rootTripsRef);
  console.log("Found root trips:", rootTripsSnap.docs.length);
  rootTripsSnap.docs.slice(0, 2).forEach(d => console.log(d.id, d.data()));
}
main().catch(console.error);
  `;
  fs.writeFileSync('test-fb.ts', code);
}
check();
