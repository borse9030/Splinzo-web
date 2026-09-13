import { collection, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Expense } from "@/types/expense";

export const expenseService = {
  async addExpense(
    groupId: string,
    expenseData: Omit<Expense, "id" | "createdAt" | "groupId">
  ): Promise<Expense> {
    const expenseRef = doc(collection(db, `groups/${groupId}/expenses`));

    // Filter payers map to only users who contributed > 0
    let cleanedPayers: { [userId: string]: number } | null = null;
    if (expenseData.payers && Object.keys(expenseData.payers).length > 0) {
      cleanedPayers = {};
      for (const [uid, amt] of Object.entries(expenseData.payers)) {
        if (typeof amt === "number" && amt > 0) {
          cleanedPayers[uid] = Number(amt.toFixed(2));
        }
      }
      if (Object.keys(cleanedPayers).length === 0) cleanedPayers = null;
    }

    // Determine effective payerId
    let effectivePayerId = expenseData.payerId;
    if (cleanedPayers && Object.keys(cleanedPayers).length > 0) {
      // Find the highest contributor as the primary payerId
      const topPayer = Object.entries(cleanedPayers).sort((a, b) => b[1] - a[1])[0];
      effectivePayerId = topPayer ? topPayer[0] : expenseData.payerId;
    }

    // Deep sanitize to prevent any undefined values from crashing Firestore setDoc
    const rawExpense: Record<string, any> = {
      ...expenseData,
      payerId: effectivePayerId,
      payers: cleanedPayers,
      groupId,
      createdAt: serverTimestamp(),
    };

    const sanitizedExpense: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawExpense)) {
      if (value !== undefined) {
        sanitizedExpense[key] = value;
      }
    }

    await setDoc(expenseRef, sanitizedExpense);

    return {
      id: expenseRef.id,
      ...sanitizedExpense,
      createdAt: Timestamp.now(), // Fallback for local state
    } as Expense;
  },

  async getExpense(groupId: string, expenseId: string): Promise<Expense | null> {
    const { getDoc } = await import("firebase/firestore");
    const docRef = doc(db, `groups/${groupId}/expenses`, expenseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Expense;
    }
    return null;
  },

  async updateExpense(
    groupId: string,
    expenseId: string,
    updates: Partial<Expense>
  ): Promise<void> {
    const { updateDoc } = await import("firebase/firestore");
    const docRef = doc(db, `groups/${groupId}/expenses`, expenseId);
    await updateDoc(docRef, updates as any);
  }
};
