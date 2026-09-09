import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Invitation } from "@/types/invitation";
import { AppUser } from "@/types/user";
import { GroupMember } from "@/types/group";

export const invitationService = {
  /**
   * Invite a user to a group by email.
   * If the user already has an account, this could add them directly, but standard flow creates an invitation.
   */
  async inviteUser(
    groupId: string, 
    groupName: string, 
    inviter: AppUser, 
    emailToInvite: string
  ): Promise<void> {
    const email = emailToInvite.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }

    // 1. Verify user exists in Splinzo (matching mobile app's FirebaseGroupRepository)
    const userQ = query(collection(db, "users"), where("email", "==", email));
    const userSnap = await getDocs(userQ);
    if (userSnap.empty) {
      throw new Error(`User with email ${email} not found. They must sign up first.`);
    }

    // 2. Check if user is already a member of this group
    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
      throw new Error("Group not found.");
    }
    const groupData = groupSnap.data();
    const existingMemberIds: string[] = groupData?.memberIds || [];
    const targetUserId = userSnap.docs[0].id;
    if (existingMemberIds.includes(targetUserId)) {
      throw new Error("User is already a member of this group.");
    }
    
    // 3. Check if invitation already exists and is pending
    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      where("inviteeEmail", "==", email),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("An invitation is already pending for this email.");
    }

    // 4. Create invitation doc
    const invRef = doc(collection(db, "invitations"));
    await setDoc(invRef, {
      groupId,
      groupName,
      inviterName: inviter.displayName || inviter.name || "A member",
      inviteeEmail: email,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(invitationId: string, groupId: string, currentUser: AppUser): Promise<void> {
    // 1. Mark invitation as accepted
    const invRef = doc(db, "invitations", invitationId);
    await updateDoc(invRef, { status: "accepted" });

    // 2. Check if user is already a member (prevent duplicates)
    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found");

    const groupData = groupSnap.data();
    const existingMemberIds: string[] = groupData?.memberIds || [];
    if (existingMemberIds.includes(currentUser.id)) {
      // Already a member — nothing more to do
      return;
    }

    // 3. Add user to the group
    const newMember: GroupMember = {
      id: currentUser.id,
      name: currentUser.displayName,
      email: currentUser.email.toLowerCase(),
      role: "member",
      joinedAt: Timestamp.now()
    };
    
    await updateDoc(groupRef, {
      memberIds: arrayUnion(currentUser.id),
      members: arrayUnion(newMember)
    });
  },

  /**
   * Decline an invitation (by the invitee)
   */
  async declineInvitation(invitationId: string): Promise<void> {
    const invRef = doc(db, "invitations", invitationId);
    await updateDoc(invRef, { status: "declined" });
  },

  /**
   * Cancel a sent invitation (by the inviter / admin).
   * Marks as "cancelled" so the invitee no longer sees it.
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const invRef = doc(db, "invitations", invitationId);
    await updateDoc(invRef, { status: "cancelled" });
  },

  /**
   * Fetch all pending invitations for a specific group (for showing in the Members tab).
   */
  async getGroupPendingInvitations(groupId: string): Promise<Invitation[]> {
    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invitation));
  }
};
