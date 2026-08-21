import { Timestamp } from "firebase/firestore";

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  currency: string;
  createdAt: Timestamp;
  createdBy: string;
  splitBetweenIds: string[];
  customSplitAmounts: { [userId: string]: number } | null;
  billImageUrl: string | null;
  category: string;
  originalAmount?: number | null;
  originalCurrency?: string | null;
}
