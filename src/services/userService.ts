import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp, collection, getDocs, query, where } from "firebase/firestore";
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

  /**
   * Extracts canonical phone number key for uniqueness registry.
   * Supports international format with dialCode (e.g. +1, +44, +91, +971) as well as domestic numbers.
   */
  canonicalizePhone(rawPhone: string, dialCode?: string): string {
    if (!rawPhone) return "";
    let clean = rawPhone.replace(/\D/g, "");
    if (!clean) return "";

    if (rawPhone.trim().startsWith("+")) {
      return clean;
    }

    if (dialCode) {
      const dialClean = dialCode.replace(/\D/g, "");
      if (clean.startsWith(dialClean) && clean.length > dialClean.length) {
        return clean;
      }
      if (clean.startsWith("0")) {
        clean = clean.slice(1);
      }
      return `${dialClean}${clean}`;
    }

    // Default to Indian country code if 10 digits
    if (clean.length === 10) {
      return `91${clean}`;
    }
    return clean;
  },

  /**
   * Checks whether a phone number is available or already used by another account.
   * Returns { available: true, canonicalPhone } if free, or { available: false, error } if taken.
   */
  async checkPhoneAvailability(
    rawPhone: string,
    currentUserId?: string,
    dialCode?: string
  ): Promise<{ available: boolean; error?: string; canonicalPhone: string }> {
    const canonical = this.canonicalizePhone(rawPhone, dialCode);
    const digitsOnly = rawPhone.replace(/\D/g, "");
    if (!canonical || digitsOnly.length < 7) {
      return {
        available: false,
        error: "Please enter a valid mobile number.",
        canonicalPhone: canonical,
      };
    }

    try {
      // 1. Direct O(1) check in dedicated phone_registry collection
      const registryRef = doc(db, "phone_registry", canonical);
      const registrySnap = await getDoc(registryRef);
      if (registrySnap.exists()) {
        const data = registrySnap.data();
        if (data?.uid && data.uid === currentUserId) {
          return { available: true, canonicalPhone: canonical };
        }
        return {
          available: false,
          error: "This mobile number is already registered with another account. Each account must have a unique mobile number.",
          canonicalPhone: canonical,
        };
      }

      // Backward-compat check for 10-digit Indian legacy key in phone_registry
      const last10 = canonical.length >= 10 ? canonical.slice(-10) : "";
      if (last10 && last10 !== canonical) {
        const legacyRef = doc(db, "phone_registry", last10);
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          const data = legacySnap.data();
          if (data?.uid && data.uid === currentUserId) {
            return { available: true, canonicalPhone: canonical };
          }
          return {
            available: false,
            error: "This mobile number is already registered with another account. Each account must have a unique mobile number.",
            canonicalPhone: canonical,
          };
        }
      }

      // 2. Fallback check across existing users collection
      const checks = [
        query(collection(db, "users"), where("phoneTenDigit", "==", last10 || canonical)),
        query(collection(db, "users"), where("normalizedPhone", "==", `91${last10 || canonical}`)),
        query(collection(db, "users"), where("phoneNumber", "==", rawPhone.trim())),
        query(collection(db, "users"), where("phone", "==", rawPhone.trim())),
      ];

      for (const q of checks) {
        const snap = await getDocs(q);
        for (const docItem of snap.docs) {
          if (docItem.id !== currentUserId) {
            // Backfill registry for this existing user
            try {
              await setDoc(registryRef, {
                uid: docItem.id,
                phone: canonical,
                normalizedPhone: `+${canonical}`,
                updatedAt: serverTimestamp(),
              });
            } catch (_) {}

            return {
              available: false,
              error: "This mobile number is already registered with another account. Each account must have a unique mobile number.",
              canonicalPhone: canonical,
            };
          }
        }
      }

      return { available: true, canonicalPhone: canonical };
    } catch (e: any) {
      console.error("[userService] Error checking phone availability:", e);
      return {
        available: false,
        error: e?.message || "Failed to verify mobile number uniqueness.",
        canonicalPhone: canonical,
      };
    }
  },

  /**
   * Atomically claims a phone number for a user, releasing their previous phone number if changed.
   */
  async claimPhoneNumber(uid: string, rawPhone: string, oldRawPhone?: string, dialCode?: string): Promise<string> {
    const check = await this.checkPhoneAvailability(rawPhone, uid, dialCode);
    if (!check.available) {
      throw new Error(check.error || "Mobile number is already in use by another account.");
    }

    const newCanonical = check.canonicalPhone;
    const oldCanonical = oldRawPhone ? this.canonicalizePhone(oldRawPhone, dialCode) : "";

    // 1. If old number was different and registered to this user, release it
    if (oldCanonical && oldCanonical !== newCanonical) {
      await this.releasePhoneNumber(oldCanonical, uid);
    }

    // 2. Claim new number in phone_registry
    const registryRef = doc(db, "phone_registry", newCanonical);
    await setDoc(registryRef, {
      uid,
      phone: newCanonical,
      rawPhone: rawPhone.trim(),
      normalizedPhone: `+${newCanonical}`,
      dialCode: dialCode || "+91",
      updatedAt: serverTimestamp(),
    });

    return newCanonical;
  },

  /**
   * Releases a phone number from phone_registry if claimed by this user.
   */
  async releasePhoneNumber(rawPhone: string, uid: string): Promise<void> {
    const canonical = this.canonicalizePhone(rawPhone);
    if (!canonical) return;
    try {
      const ref = doc(db, "phone_registry", canonical);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data()?.uid === uid) {
        await deleteDoc(ref);
      }
    } catch (e) {
      console.warn("[userService] Error releasing phone:", e);
    }
  },

  async createUser(
    uid: string,
    email: string,
    name: string,
    photoUrl: string = "",
    phoneNumber?: string,
    dialCode?: string
  ): Promise<AppUser> {
    const normalizedEmail = email.toLowerCase().trim();
    const userRef = doc(db, "users", uid);

    // Check if user already exists
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const existingUser = { id: docSnap.id, ...docSnap.data() } as AppUser;
      if (phoneNumber && (!existingUser.phoneNumber || !existingUser.phone)) {
        await this.updateUserPhoneNumber(uid, phoneNumber, undefined, dialCode);
        existingUser.phoneNumber = phoneNumber;
        existingUser.phone = phoneNumber;
        const c = this.canonicalizePhone(phoneNumber, dialCode);
        existingUser.phoneTenDigit = c.slice(-10);
        existingUser.normalizedPhone = `+${c}`;
      }
      cacheUser(existingUser);
      return existingUser;
    }

    let canonical = "";
    if (phoneNumber && phoneNumber.trim()) {
      canonical = await this.claimPhoneNumber(uid, phoneNumber, undefined, dialCode);
    }

    const normalizedPhone = canonical ? `+${canonical}` : "";

    const newUser = {
      name,
      displayName: name, // Default displayName to name
      email: normalizedEmail,
      photoUrl,
      phoneNumber: phoneNumber ? phoneNumber.trim() : "",
      phone: phoneNumber ? phoneNumber.trim() : "",
      phoneTenDigit: canonical ? canonical.slice(-10) : "",
      normalizedPhone: normalizedPhone,
      dialCode: dialCode || "+91",
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

  async updateUserPhoneNumber(uid: string, rawPhone: string, oldRawPhone?: string, dialCode?: string): Promise<void> {
    if (!uid) return;
    const cleanDigits = rawPhone.replace(/\D/g, "");
    if (cleanDigits.length < 7) {
      throw new Error("Please enter a valid mobile number.");
    }

    const canonical = await this.claimPhoneNumber(uid, rawPhone, oldRawPhone, dialCode);
    const normalizedPhone = `+${canonical}`;

    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        phoneNumber: rawPhone.trim(),
        phone: rawPhone.trim(),
        phoneTenDigit: canonical.slice(-10),
        normalizedPhone: normalizedPhone,
        dialCode: dialCode || "+91",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    invalidateUserCache(uid);
  },
};
