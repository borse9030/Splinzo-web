import { Timestamp } from "firebase/firestore";

export type ReminderCategory = "friendly" | "urgent" | "casual" | "deadline" | "custom";
export type ReminderStatus = "active" | "completed" | "cancelled";
export type RepeatInterval = "none" | "every_6h" | "every_12h" | "daily";

export interface Reminder {
  id: string;
  groupId: string;
  fromUserId: string;       // Debtor (person who owes money)
  fromUserName: string;
  toUserId: string;         // Creditor (person owed money)
  toUserName: string;
  amount: number;
  currency: string;
  message: string;          // Custom reminder message
  category: ReminderCategory;
  timerDurationHours: number; // e.g. 1, 6, 12, 24, 48, 72
  dueAt: Timestamp | Date | any;  // Deadline when timer expires
  repeatInterval: RepeatInterval;
  status: ReminderStatus;   // "active" | "completed" | "cancelled"
  settledReason?: "payment_received" | "cancelled_by_user" | "expired";
  settledPaymentId?: string; // ID of the payment that auto-stopped the timer
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
  completedAt?: Timestamp | Date | any;
}

export interface ReminderFormData {
  message: string;
  category: ReminderCategory;
  timerDurationHours: number;
  customDueDate?: string; // ISO date-time string if custom date chosen
  repeatInterval: RepeatInterval;
}
