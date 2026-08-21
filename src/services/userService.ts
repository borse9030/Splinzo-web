import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AppUser } from "@/types/user";

export const getUsers = async (uids: string[]): Promise<AppUser[]> => {
  if (!uids.length) return [];
  const promises = uids.map(uid => userService.getUser(uid));
  const results = await Promise.all(promises);
  return results.filter((u): u is AppUser => u !== null);
};

export const userService = {
  async getUser(uid: string): Promise<AppUser | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AppUser;
    }
    return null;
  },

  async createUser(
    uid: string,
    email: string,
    name: string,
    photoUrl: string = ""
  ): Promise<AppUser> {
    const normalizedEmail = email.toLowerCase().trim();
    const userRef = doc(db, "users", uid);

    // Check if user already exists
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AppUser;
    }

    const newUser = {
      name,
      displayName: name, // Default displayName to name
      email: normalizedEmail,
      photoUrl,
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, newUser);

    return {
      id: uid,
      ...newUser,
      createdAt: Timestamp.now(), // Fallback for local state before refresh
    } as AppUser;
  },
};
