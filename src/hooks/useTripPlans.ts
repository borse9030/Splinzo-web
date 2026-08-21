import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { TripPlan } from "@/types/plan";

export function useTripPlans(groupId: string, tripId: string) {
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId || !tripId) return;

    setLoading(true);
    const plansQuery = query(
      collection(db, "groups", groupId, "trips", tripId, "plans"),
      orderBy("date", "asc") // chronological
    );

    const unsubscribe = onSnapshot(
      plansQuery,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          groupId,
          tripId,
          ...doc.data(),
        })) as TripPlan[];
        
        // Also sort by time in memory since we can't easily compound order by string time in Firestore without a compound index
        fetched.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          const dateDiff = a.date.seconds - b.date.seconds;
          if (dateDiff !== 0) return dateDiff;
          return (a.time || "").localeCompare(b.time || "");
        });

        setPlans(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching trip plans:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId, tripId]);

  return { plans, loading, error };
}
