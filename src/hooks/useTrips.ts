import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Trip } from "@/types/trip";

export function useTrips(groupId: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    const tripsQuery = query(
      collection(db, "groups", groupId, "trips"),
      orderBy("startDate", "desc") // show newest first
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const fetchedTrips = snapshot.docs.map((doc) => ({
          id: doc.id,
          groupId,
          ...doc.data(),
        })) as Trip[];
        setTrips(fetchedTrips);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching trips:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { trips, loading, error };
}
