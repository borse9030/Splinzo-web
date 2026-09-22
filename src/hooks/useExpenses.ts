"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Expense } from "@/types/expense";

// Module-level in-memory cache for instant 0ms switching & zero skeleton flash
const expensesCache = new Map<string, Expense[]>();

export function useExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<Expense[]>(() => (groupId ? expensesCache.get(groupId) || [] : []));
  const [loading, setLoading] = useState<boolean>(() => (groupId ? !expensesCache.has(groupId) : true));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) return;

    if (!expensesCache.has(groupId)) {
      setLoading(true);
    }
    // Subcollection: groups/{groupId}/expenses
    const q = query(
      collection(db, `groups/${groupId}/expenses`),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Expense[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Expense);
        });
        expensesCache.set(groupId, fetched);
        setExpenses(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching expenses:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { expenses, loading, error };
}
