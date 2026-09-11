import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface PersonalExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: any;
  notes?: string;
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

  async addPersonalExpense(userId: string, item: { description: string; amount: number; category: string; date?: Date; notes?: string }) {
    const ref = doc(collection(db, `users/${userId}/personal_expenses`));
    const data = {
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: item.date ? Timestamp.fromDate(item.date) : Timestamp.now(),
      notes: item.notes || null,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return { id: ref.id, ...data };
  },

  async deletePersonalExpense(userId: string, expenseId: string) {
    await deleteDoc(doc(db, `users/${userId}/personal_expenses`, expenseId));
  }
};
