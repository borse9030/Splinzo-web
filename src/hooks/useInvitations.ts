"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Invitation } from "@/types/invitation";

export function useInvitations() {
  const { appUser } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!appUser?.email) return;

    setLoading(true);
    const q = query(
      collection(db, "invitations"),
      where("invitedEmail", "==", appUser.email),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Invitation[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Invitation);
        });
        setInvitations(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching invitations:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser?.email]);

  return { invitations, loading, error };
}
