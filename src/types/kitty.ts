import { Timestamp } from "firebase/firestore";

export interface KittyContribution {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  memberPhotoUrl?: string;
  amount: number;
  note?: string;
  createdAt: Timestamp;
}

export interface KittySummary {
  totalPooled: number;
  totalSpent: number;
  balance: number;
  contributorsCount: number;
}
