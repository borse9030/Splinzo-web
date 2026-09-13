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
  customSplitAmounts?: { [userId: string]: number } | null;
  billImageUrl?: string | null;
  imageUrl?: string | null;
  receiptUrl?: string | null;
  category: string;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  splitMode?: string; // 'equal' | 'percentage' | 'shares' | 'custom'
  splitPercentages?: { [userId: string]: number } | null;
  splitShares?: { [userId: string]: number } | null;
  splitAdjustments?: { [userId: string]: number } | null;
  payers?: { [userId: string]: number } | null;
  isRecurring?: boolean;
  recurringInterval?: string | null; // 'daily' | 'weekly' | 'monthly'
  itemizedItems?: Array<{ name: string; price: number; assignedTo: string[] }> | null;
  isPaidFromKitty?: boolean;
}
