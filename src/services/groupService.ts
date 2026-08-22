import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { storageService } from "@/services/storageService";
import { Group, GroupMember } from "@/types/group";
import { AppUser } from "@/types/user";

export const groupService = {
  async createGroup(
    name: string,
    type: string,
    currency: string,
    imageFile: File | null,
    currentUser: AppUser
  ): Promise<string> {
    const groupRef = doc(collection(db, "groups"));
    const groupId = groupRef.id;

    let imageUrl = "";
    if (imageFile) {
      imageUrl = await storageService.uploadFile(imageFile);
    }

    const adminMember: GroupMember = {
      id: currentUser.id,
      name: currentUser.displayName || currentUser.email.split("@")[0],
      email: currentUser.email,
      photoURL: currentUser.photoUrl || currentUser.photoURL,
      photoUrl: currentUser.photoUrl || currentUser.photoURL,
      role: "admin",
      joinedAt: Timestamp.now(),
    };

    const newGroup: Partial<Group> = {
      name,
      type,
      currency,
      imageUrl,
      createdBy: currentUser.id,
      createdAt: Timestamp.now(),
      memberIds: [currentUser.id],
      members: [adminMember],
    };

    await setDoc(groupRef, newGroup);
    return groupId;
  },

  subscribeToUserGroups(
    userId: string,
    onUpdate: (groups: Group[]) => void,
    onError: (error: Error) => void
  ) {
    // According to the specification, groups are subscribed where memberIds arrayContains currentUser.uid
    const q = query(
      collection(db, "groups"),
      where("memberIds", "array-contains", userId),
      // We'll sort locally or if an index exists, we can add orderBy("createdAt", "desc")
      // orderBy requires a composite index with array-contains. We will omit it to avoid requiring an immediate index.
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groups: Group[] = [];
        const allMemberIds = new Set<string>();
        
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Group;
          groups.push(data);
          data.memberIds?.forEach(id => allMemberIds.add(id));
        });
        
        // Sort groups by creation date descending
        groups.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        
        // Initial quick render
        onUpdate(groups);

        // Enrich members asynchronously
        if (allMemberIds.size > 0) {
          import("@/services/userService").then(({ getUsers }) => {
            getUsers(Array.from(allMemberIds)).then(realUsers => {
              const enrichedGroups = groups.map(g => ({
                ...g,
                members: g.members?.map(m => {
                  const realU = realUsers.find(ru => ru.id === m.id);
                  return realU 
                    ? { 
                        ...m, 
                        photoURL: realU.photoUrl || realU.photoURL || m.photoURL || m.photoUrl,
                        name: realU.name || m.name,
                      } 
                    : m;
                })
              }));
              onUpdate(enrichedGroups);
            }).catch(console.error);
          });
        }
      },
      (error) => {
        console.error("Error subscribing to groups:", error);
        onError(error);
      }
    );

    return unsubscribe;
  },

  async deleteGroup(groupId: string): Promise<void> {
    // Helper to delete all documents in a subcollection
    const deleteCollection = async (path: string) => {
      try {
        const snapshot = await getDocs(collection(db, path));
        if (snapshot.empty) return;
        
        // Chunk deletions into batches of 400 (limit is 500)
        let batch = writeBatch(db);
        let count = 0;
        
        for (const d of snapshot.docs) {
          batch.delete(d.ref);
          count++;
          if (count % 400 === 0) {
            await batch.commit();
            batch = writeBatch(db);
          }
        }
        if (count % 400 !== 0) {
          await batch.commit();
        }
      } catch (err) {
        console.error(`Failed to delete collection ${path}:`, err);
      }
    };

    // Helper to delete documents by query
    const deleteByQuery = async (colPath: string, field: string, value: string) => {
      try {
        const q = query(collection(db, colPath), where(field, "==", value));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;
        
        let batch = writeBatch(db);
        let count = 0;
        for (const d of snapshot.docs) {
          batch.delete(d.ref);
          count++;
          if (count % 400 === 0) {
            await batch.commit();
            batch = writeBatch(db);
          }
        }
        if (count % 400 !== 0) {
          await batch.commit();
        }
      } catch (err) {
        console.error(`Failed to delete queried documents in ${colPath}:`, err);
      }
    };

    // 1. Delete top-level relations
    await deleteByQuery("invitations", "groupId", groupId);
    await deleteByQuery("payments", "groupId", groupId);

    // 2. Delete nested subcollections (Trips -> Plans, Calls -> Signaling)
    try {
      const tripsSnap = await getDocs(collection(db, `groups/${groupId}/trips`));
      for (const trip of tripsSnap.docs) {
        await deleteCollection(`groups/${groupId}/trips/${trip.id}/plans`);
      }
      
      const callsSnap = await getDocs(collection(db, `groups/${groupId}/calls`));
      for (const call of callsSnap.docs) {
        await deleteCollection(`groups/${groupId}/calls/${call.id}/signaling`);
      }
    } catch (err) {
      console.error("Error traversing nested subcollections:", err);
    }

    // 3. Delete direct subcollections
    await deleteCollection(`groups/${groupId}/expenses`);
    await deleteCollection(`groups/${groupId}/messages`);
    await deleteCollection(`groups/${groupId}/trips`);
    await deleteCollection(`groups/${groupId}/calls`);

    // 4. Finally, delete the group document itself
    const groupRef = doc(db, "groups", groupId);
    await deleteDoc(groupRef);
  }
};
