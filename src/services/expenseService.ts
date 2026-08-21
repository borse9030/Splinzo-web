import { collection, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Expense } from "@/types/expense";

export const expenseService = {
  async addExpense(
    groupId: string,
    expenseData: Omit<Expense, "id" | "createdAt" | "groupId">
  ): Promise<Expense> {
    const expenseRef = doc(collection(db, `groups/${groupId}/expenses`));
    const newExpense = {
      ...expenseData,
      groupId,
      createdAt: serverTimestamp(),
    };

    await setDoc(expenseRef, newExpense);

    return {
      id: expenseRef.id,
      ...newExpense,
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
  }
};
