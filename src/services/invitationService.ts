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
    
    // Check if invitation already exists
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

    const invRef = doc(collection(db, "invitations"));
    await setDoc(invRef, {
      groupId,
      groupName,
      inviterName: inviter.displayName,
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
