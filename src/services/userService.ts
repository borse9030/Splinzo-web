import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AppUser } from "@/types/user";

// In-memory cache for user profiles to eliminate redundant Firestore getDoc reads
interface CachedUserEntry {
  user: AppUser | null;
  cachedAt: number;
}

const userProfileCache = new Map<string, CachedUserEntry>();
const USER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

export function invalidateUserCache(uid?: string) {
  if (uid) {
    userProfileCache.delete(uid);
  } else {
    userProfileCache.clear();
  }
}

export function cacheUser(user: AppUser) {
  if (user?.id) {
    userProfileCache.set(user.id, {
      user,
      cachedAt: Date.now(),
    });
  }
}

export const getUsers = async (uids: string[]): Promise<AppUser[]> => {
  if (!uids || !uids.length) return [];
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const now = Date.now();
  const results: AppUser[] = [];
  const uidsToFetch: string[] = [];

  for (const uid of uniqueUids) {
    const cached = userProfileCache.get(uid);
    if (cached && now - cached.cachedAt < USER_CACHE_TTL_MS) {
      if (cached.user) results.push(cached.user);
    } else {
      uidsToFetch.push(uid);
    }
  }

  if (uidsToFetch.length > 0) {
    const fetchedUsers = await Promise.all(uidsToFetch.map((uid) => userService.getUser(uid)));
    for (const u of fetchedUsers) {
      if (u) results.push(u);
    }
  }

  return results;
};

export const userService = {
  async getUser(uid: string): Promise<AppUser | null> {
    if (!uid) return null;
    const now = Date.now();
    const cached = userProfileCache.get(uid);
    if (cached && now - cached.cachedAt < USER_CACHE_TTL_MS) {
      return cached.user;
    }

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const user = { id: docSnap.id, ...docSnap.data() } as AppUser;
        userProfileCache.set(uid, { user, cachedAt: now });
        return user;
      }
      userProfileCache.set(uid, { user: null, cachedAt: now });
      return null;
    } catch (e) {
      console.error(`Error fetching user profile ${uid}:`, e);
      if (cached?.user) return cached.user;
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<AppUser | null> {
    const cleanEmail = email.trim();
    if (!cleanEmail) return null;
    const normalizedEmail = cleanEmail.toLowerCase();
    const q = query(collection(db, "users"), where("email", "==", normalizedEmail));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const d = querySnap.docs[0];
      const user = { id: d.id, ...d.data() } as AppUser;
      cacheUser(user);
      return user;
    }

    if (cleanEmail !== normalizedEmail) {
      const qFallback = query(collection(db, "users"), where("email", "==", cleanEmail));
      const fallbackSnap = await getDocs(qFallback);
      if (!fallbackSnap.empty) {
        const d = fallbackSnap.docs[0];
        const user = { id: d.id, ...d.data() } as AppUser;
        cacheUser(user);
        return user;
      }
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
      const existingUser = { id: docSnap.id, ...docSnap.data() } as AppUser;
      cacheUser(existingUser);
      return existingUser;
    }

    const newUser = {
      name,
      displayName: name, // Default displayName to name
      email: normalizedEmail,
      photoUrl,
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, newUser);

    const created = {
      id: uid,
      ...newUser,
      createdAt: Timestamp.now(), // Fallback for local state before refresh
    } as AppUser;
    cacheUser(created);
    return created;
  },
};
