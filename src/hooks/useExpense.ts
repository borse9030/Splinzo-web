"use client";

import { useState, useEffect } from "react";
import { expenseService } from "@/services/expenseService";
import { Expense } from "@/types/expense";

export function useExpense(groupId: string, expenseId: string) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchExpense() {
      if (!groupId || !expenseId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await expenseService.getExpense(groupId, expenseId);
        setExpense(data);
        setError(null);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchExpense();
  }, [groupId, expenseId]);

  return { expense, loading, error };
}
