"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Group } from "@/types/group";

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    const docRef = doc(db, "groups", groupId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawGroup = { id: snapshot.id, ...snapshot.data() } as Group;
          const rawMembers = Array.isArray(rawGroup.members) ? rawGroup.members : [];
          const rawMemberIds = Array.isArray(rawGroup.memberIds) && rawGroup.memberIds.length > 0
            ? rawGroup.memberIds
            : rawMembers.map((m: any) => m.id).filter(Boolean);

          const safeGroup: Group = {
            ...rawGroup,
            members: rawMembers,
            memberIds: rawMemberIds,
          };
          setGroup(safeGroup); // Initial fast render
          
          // Enrich members with their actual photoUrl from the users collection
          if (rawMemberIds.length > 0) {
            import("@/services/userService").then(({ getUsers }) => {
              getUsers(rawMemberIds).then((realUsers) => {
                const enrichedMembers = rawMembers.map((m) => {
                  const realU = realUsers.find((ru) => ru.id === m.id);
                  return realU
                    ? {
                        ...m,
                        photoURL: realU.photoUrl || realU.photoURL || m.photoURL || m.photoUrl,
                        name: realU.name || m.name,
                        displayName: realU.displayName || (m as any).displayName,
                      }
                    : m;
                });
                setGroup({ ...safeGroup, members: enrichedMembers });
              }).catch(err => console.error("Failed to enrich members:", err));
            });
          }
        } else {
          setError(new Error("Group not found"));
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to group:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { group, loading, error };
}
