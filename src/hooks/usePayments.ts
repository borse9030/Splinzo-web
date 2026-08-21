"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Payment } from "@/types/payment";

export function usePayments(groupId: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    // Subcollection: payments where groupId == groupId
    // In Flutter code, it might be a top level collection `payments`
    const q = query(
      collection(db, "payments"),
      where("groupId", "==", groupId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Payment[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Payment);
        });
        setPayments(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching payments:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { payments, loading, error };
}
