"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useGroups } from "@/hooks/useGroups";
import { ActivityLog } from "@/types/activity";

export function useActivityFeed() {
  const [feed, setFeed] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { groups, loading: groupsLoading } = useGroups();

  useEffect(() => {
    if (groupsLoading) return;
    
    if (groups.length === 0) {
      setFeed([]);
      setLoading(false);
      return;
    }

    const groupIds = groups.map(g => g.id);
    
    // Firestore 'in' queries only support up to 10 items.
    // Match the Flutter app logic: take the first 10 group IDs.
    const limitedGroupIds = groupIds.slice(0, 10);

    const q = query(
      collection(db, "activities"),
      where("groupId", "in", limitedGroupIds),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ActivityLog;
      });
      
      setFeed(activitiesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activity feed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groups, groupsLoading]);

  return { feed, loading };
}
