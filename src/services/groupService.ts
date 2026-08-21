import { collection, query, where, onSnapshot, doc, setDoc, Timestamp } from "firebase/firestore";
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
};
