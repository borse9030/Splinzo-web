import { Timestamp } from "firebase/firestore";

export interface BatchSettlementItem {
  toUserId: string;
  toUserName: string;
  amount: number;
  receiverUpiId?: string;
}

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
  verifiedVia?: "setu" | "manual" | "setu_batch" | "setu_simulation" | "setu_webhook";
  status: "pending_approval" | "approved";
  feeTier?: "instant" | "free_ad";
  adWatched?: boolean;
  type?: "single" | "batch";
  batchItems?: BatchSettlementItem[];
  batchMasterId?: string;
  savingsAmount?: number;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
}
