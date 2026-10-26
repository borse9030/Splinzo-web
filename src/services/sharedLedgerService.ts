import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SharedLedger, CreateSharedLedgerInput, SharedExpenseItem } from "@/types/sharedLedger";
import { PersonalExpenseItem } from "@/services/personalExpenseService";

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "sl_";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function parseExpenseDate(date: any): Date {
  if (!date) return new Date();
  if (typeof date?.toDate === "function") return date.toDate();
  if (date instanceof Date) return date;
  if (typeof date?.seconds === "number") return new Date(date.seconds * 1000);
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date || obj instanceof Timestamp) return obj;
  if (typeof obj?.isEqual === "function") return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined).filter(v => v !== undefined);
  }
  if (typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export const sharedLedgerService = {
  async createSharedLedger(input: CreateSharedLedgerInput): Promise<SharedLedger> {
    const shareId = generateShareId();
    const ref = doc(db, "shared_ledgers", shareId);

    let pinHash: string | undefined;
    if (input.pin && input.pin.trim().length > 0) {
      pinHash = await hashPin(input.pin.trim());
    }

    let expiresAt: Timestamp | null = null;
    if (input.expiresInDays && input.expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + input.expiresInDays);
      expiresAt = Timestamp.fromDate(expDate);
    }

    // Clean expense items (no undefined values)
    const cleanedItems: SharedExpenseItem[] = input.items.map(item => {
      const cleaned: SharedExpenseItem = {
        id: item.id || "",
        description: item.description || "",
        amount: Number(item.amount) || 0,
        category: item.category || "General",
        date: item.date ? (typeof item.date?.toDate === "function" ? item.date : Timestamp.fromDate(parseExpenseDate(item.date))) : Timestamp.now(),
        paymentMethod: item.paymentMethod || "UPI",
      };
      if (!input.maskNotes && item.notes) {
        cleaned.notes = item.notes;
      }
      return cleaned;
    });

    const data: Record<string, any> = {
      userId: input.userId || "",
      ownerName: input.ownerName || "Splinzo User",
      ownerEmail: input.ownerEmail || "",
      ownerPhotoUrl: input.ownerPhotoUrl || "",
      title: input.title || "Pocket Ledger",
      filterScope: input.filterScope || "month",
      monthYear: input.monthYear || "",
      startDate: input.startDate || "",
      endDate: input.endDate || "",
      categories: input.categories || [],
      maskNotes: !!input.maskNotes,
      maskAmounts: !!input.maskAmounts,
      hasPin: !!pinHash,
      pinHash: pinHash || "",
      isLiveSync: input.isLiveSync ?? true,
      isActive: true,
      expiresAt: expiresAt ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewCount: 0,
      items: cleanedItems,
    };

    const sanitizedData = cleanUndefined(data);
    await setDoc(ref, sanitizedData);

    return {
      id: shareId,
      ...sanitizedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SharedLedger;
  },

  async getSharedLedger(shareId: string): Promise<SharedLedger | null> {
    const snap = await getDoc(doc(db, "shared_ledgers", shareId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SharedLedger;
  },

  async getUserSharedLedgers(userId: string): Promise<SharedLedger[]> {
    try {
      const q = query(
        collection(db, "shared_ledgers"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedLedger));
    } catch {
      // Fallback query if composite index not ready
      const q = query(
        collection(db, "shared_ledgers"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedLedger));
      return list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    }
  },

  async toggleSharedLedgerStatus(shareId: string, isActive: boolean): Promise<void> {
    const ref = doc(db, "shared_ledgers", shareId);
    await updateDoc(ref, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteSharedLedger(shareId: string): Promise<void> {
    await deleteDoc(doc(db, "shared_ledgers", shareId));
  },

  async recordView(shareId: string): Promise<void> {
    try {
      const ref = doc(db, "shared_ledgers", shareId);
      await updateDoc(ref, {
        viewCount: increment(1)
      });
    } catch (e) {
      console.warn("Could not increment view count", e);
    }
  },

  /**
   * Automatically re-filters and syncs active shared ledgers when user edits personal expenses
   */
  async syncActiveSharedLedgers(userId: string, allExpenses: PersonalExpenseItem[]): Promise<void> {
    try {
      const userLedgers = await this.getUserSharedLedgers(userId);
      const liveLedgers = userLedgers.filter(l => l.isActive && l.isLiveSync);

      for (const ledger of liveLedgers) {
        let filtered = [...allExpenses];

        // Scope filter
        if (ledger.filterScope === "month" && ledger.monthYear) {
          filtered = filtered.filter(item => {
            const d = parseExpenseDate(item.date);
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            return ym === ledger.monthYear;
          });
        } else if (ledger.filterScope === "date_range" && ledger.startDate && ledger.endDate) {
          const start = new Date(ledger.startDate);
          const end = new Date(ledger.endDate);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter(item => {
            const d = parseExpenseDate(item.date);
            return d >= start && d <= end;
          });
        }

        // Category filter
        if (ledger.categories && ledger.categories.length > 0) {
          filtered = filtered.filter(item => ledger.categories.includes(item.category));
        }

        // Clean items (mask notes if applicable, no undefined)
        const updatedItems: SharedExpenseItem[] = filtered.map(item => {
          const cleaned: SharedExpenseItem = {
            id: item.id || "",
            description: item.description || "",
            amount: Number(item.amount) || 0,
            category: item.category || "General",
            date: item.date ? (typeof item.date?.toDate === "function" ? item.date : Timestamp.fromDate(parseExpenseDate(item.date))) : Timestamp.now(),
            paymentMethod: item.paymentMethod || "UPI",
          };
          if (!ledger.maskNotes && item.notes) {
            cleaned.notes = item.notes;
          }
          return cleaned;
        });

        await updateDoc(doc(db, "shared_ledgers", ledger.id), {
          items: cleanUndefined(updatedItems),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn("Failed to auto-sync active shared ledgers:", err);
    }
  }
};
