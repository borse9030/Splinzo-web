import { Timestamp } from "firebase/firestore";

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: Timestamp;
}
