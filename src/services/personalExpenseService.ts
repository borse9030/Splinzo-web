import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

import { sharedLedgerService } from "@/services/sharedLedgerService";

export interface PersonalExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: any;
  notes?: string;
  paymentMethod?: string;
}

export const personalExpenseService = {
  async getPersonalExpenses(userId: string): Promise<PersonalExpenseItem[]> {
    const q = query(
      collection(db, `users/${userId}/personal_expenses`),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PersonalExpenseItem));
  },

  async addPersonalExpense(userId: string, item: {
    description: string;
    amount: number;
    category: string;
    date?: Date;
    notes?: string;
    paymentMethod?: string;
  }) {
    const ref = doc(collection(db, `users/${userId}/personal_expenses`));
    const data = {
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: item.date ? Timestamp.fromDate(item.date) : Timestamp.now(),
      notes: item.notes || null,
      paymentMethod: item.paymentMethod || null,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);

    // Auto-sync active shared ledgers in background
    this.getPersonalExpenses(userId).then(all => {
      sharedLedgerService.syncActiveSharedLedgers(userId, all);
    }).catch(e => console.warn("Sync ledger notice:", e));

    return { id: ref.id, ...data };
  },

  async updatePersonalExpense(userId: string, expenseId: string, item: {
    description: string;
    amount: number;
    category: string;
    date?: Date;
    notes?: string;
    paymentMethod?: string;
  }) {
    const ref = doc(db, `users/${userId}/personal_expenses`, expenseId);
    const data = {
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: item.date ? Timestamp.fromDate(item.date) : Timestamp.now(),
      notes: item.notes || null,
      paymentMethod: item.paymentMethod || null,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(ref, data);

    // Auto-sync active shared ledgers in background
    this.getPersonalExpenses(userId).then(all => {
      sharedLedgerService.syncActiveSharedLedgers(userId, all);
    }).catch(e => console.warn("Sync ledger notice:", e));

    return { id: expenseId, ...data };
  },

  async deletePersonalExpense(userId: string, expenseId: string) {
    await deleteDoc(doc(db, `users/${userId}/personal_expenses`, expenseId));

    // Auto-sync active shared ledgers in background
    this.getPersonalExpenses(userId).then(all => {
      sharedLedgerService.syncActiveSharedLedgers(userId, all);
    }).catch(e => console.warn("Sync ledger notice:", e));
  },

  async getMonthlyBudget(userId: string): Promise<number> {
    try {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        const val = snap.data()?.soloMonthlyBudget;
        return typeof val === "number" ? val : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  async setMonthlyBudget(userId: string, budget: number): Promise<void> {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { soloMonthlyBudget: budget }, { merge: true });
  }
};

