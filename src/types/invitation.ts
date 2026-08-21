import { Timestamp } from "firebase/firestore";

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedByUserId: string;
  invitedByUserName: string;
  invitedEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
}
