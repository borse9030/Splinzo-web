export interface SharedExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: any;
  notes?: string;
  paymentMethod?: string;
}

export type SharedLedgerScope = "month" | "date_range" | "category" | "all";

export interface SharedLedger {
  id: string;
  userId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhotoUrl?: string;
  title: string;
  filterScope: SharedLedgerScope;
  monthYear?: string; // e.g. "2026-10"
  startDate?: string;
  endDate?: string;
  categories: string[];
  maskNotes: boolean;
  maskAmounts: boolean;
  hasPin: boolean;
  pinHash?: string;
  isLiveSync: boolean;
  isActive: boolean;
  expiresAt?: any;
  createdAt: any;
  updatedAt: any;
  viewCount: number;
  items: SharedExpenseItem[];
}

export interface CreateSharedLedgerInput {
  userId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhotoUrl?: string;
  title: string;
  filterScope: SharedLedgerScope;
  monthYear?: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  maskNotes?: boolean;
  maskAmounts?: boolean;
  pin?: string;
  isLiveSync?: boolean;
  expiresInDays?: number | null; // null = never
  items: SharedExpenseItem[];
}
