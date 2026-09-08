"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Payment } from "@/types/payment";
import { paymentService } from "@/services/paymentService";

export function usePayments(groupId?: string) {
  const { appUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incomingPayments, setIncomingPayments] = useState<Payment[]>([]);
  const [outgoingPayments, setOutgoingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // If groupId is provided, fetch payments for that specific group
  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
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

        fetched.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return timeB - timeA;
        });

        setPayments(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching group payments:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // If used without groupId (or for user activity feed), fetch user's incoming and outgoing payments
  useEffect(() => {
    if (!appUser?.id) {
      if (!groupId) setLoading(false);
      return;
    }

    // 1. Incoming payments where user is the creditor (toUserId)
    const incomingQuery = query(
      collection(db, "payments"),
      where("toUserId", "==", appUser.id)
    );

    // 2. Outgoing payments where user is the debtor (fromUserId)
    const outgoingQuery = query(
      collection(db, "payments"),
      where("fromUserId", "==", appUser.id)
    );

    let incDone = false;
    let outDone = false;

    const checkDone = () => {
      if (incDone && outDone && !groupId) {
        setLoading(false);
      }
    };

    const unsubIncoming = onSnapshot(
      incomingQuery,
      (snapshot) => {
        const list: Payment[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Payment);
        });

        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return timeB - timeA;
        });

        setIncomingPayments(list);
        incDone = true;
        checkDone();
      },
      (err) => {
        console.error("Error fetching incoming payments:", err);
        incDone = true;
        checkDone();
      }
    );

    const unsubOutgoing = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        const list: Payment[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Payment);
        });

        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return timeB - timeA;
        });

        setOutgoingPayments(list);
        outDone = true;
        checkDone();
      },
      (err) => {
        console.error("Error fetching outgoing payments:", err);
        outDone = true;
        checkDone();
      }
    );

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [appUser?.id, groupId]);

  const approve = useCallback(async (paymentId: string) => {
    setApprovingId(paymentId);
    try {
      await paymentService.approvePayment(paymentId);
    } catch (err) {
      console.error("Failed to approve payment:", err);
      throw err;
    } finally {
      setApprovingId(null);
    }
  }, []);

  const pendingIncomingCount = incomingPayments.filter(p => p.status === "pending_approval").length;

  return {
    payments,
    incomingPayments,
    outgoingPayments,
    loading,
    approvingId,
    approvePayment: approve,
    pendingIncomingCount,
    error,
  };
}
