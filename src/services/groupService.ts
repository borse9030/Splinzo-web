import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Group } from "@/types/group";

export const groupService = {
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
        snapshot.forEach((doc) => {
          groups.push({ id: doc.id, ...doc.data() } as Group);
        });
        
        // Sort groups by creation date descending
        groups.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        
        onUpdate(groups);
      },
      (error) => {
        console.error("Error subscribing to groups:", error);
        onError(error);
      }
    );

    return unsubscribe;
  },
};
