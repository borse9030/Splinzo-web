import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from "firebase/firestore";
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
      where("invitedEmail", "==", email),
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
      invitedByUserId: inviter.id,
      invitedByUserName: inviter.displayName,
      invitedEmail: email,
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

    // 2. Add user to the group
    const groupRef = doc(db, "groups", groupId);
    const newMember: GroupMember = {
      id: currentUser.id,
      name: currentUser.displayName,
      email: currentUser.email,
      role: "member",
      joinedAt: Timestamp.now()
    };
    
    await updateDoc(groupRef, {
      memberIds: arrayUnion(currentUser.id),
      members: arrayUnion(newMember)
    });
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    const invRef = doc(db, "invitations", invitationId);
    await updateDoc(invRef, { status: "declined" });
  }
};
