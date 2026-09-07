import { Timestamp } from "firebase/firestore";

export interface Payment {
  id: string;
  expenseId: string; // If this payment is linked to a specific expense settlement
  groupId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  platformFee?: number;
  totalAmount?: number;
  setuLinkId?: string;
  utr?: string;
  verifiedVia?: "setu" | "manual";
  status: "pending_approval" | "approved";
  createdAt: Timestamp;
  approvedAt?: Timestamp;
}
