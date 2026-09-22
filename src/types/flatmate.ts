import { Timestamp } from "firebase/firestore";

export type WaterCanLevel = "full" | "half" | "low" | "empty";

export interface WaterDutySchedule {
  id?: string;
  groupId: string;
  defaultCost: number; // e.g. 40 or 50 INR
  canLevel: WaterCanLevel;
  currentAssigneeId: string;
  rotationOrder: string[]; // array of userIds
  weeklySchedule?: Record<string, string>; // '0' (Sun) -> userId, '1' (Mon) -> userId ...
  lastSwapNote?: string | null;
  dayAssignments?: { [dayOfWeek: number]: string }; // 0 = Sun, 1 = Mon ... -> userId
  lastCompletedAt?: Timestamp | null;
  lastCompletedBy?: string | null;
  lastExpenseId?: string | null;
  notes?: string;
}

export type ChoreFrequency = "daily" | "alternate_days" | "weekly" | "as_needed";
export type ChoreStatus = "pending" | "done" | "skipped" | "swapped";

export interface FlatChore {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  icon: string; // emoji or lucide icon name
  frequency: ChoreFrequency;
  assignedTo: string; // userId
  rotationOrder: string[]; // userIds
  status: ChoreStatus;
  defaultCost?: number; // if chore costs money e.g. gas cylinder, milk
  lastCompletedAt?: Timestamp | null;
  lastCompletedBy?: string | null;
  dueDate?: Timestamp | null;
  karmaPoints: number; // e.g. +10
}

export type MealChoice = "home" | "out" | "skip";

export interface DailyMealAttendance {
  id: string; // usually YYYY-MM-DD
  groupId: string;
  date: string; // "YYYY-MM-DD"
  lunch: { [userId: string]: MealChoice };
  dinner: { [userId: string]: MealChoice };
  notes?: string;
  updatedAt?: Timestamp;
}

export type StockStatus = "in_stock" | "running_low" | "out_of_stock";

export interface SharedPantryItem {
  id: string;
  groupId: string;
  name: string;
  category: string; // "Cooking", "Cleaning", "Toiletries", "Snacks"
  stockStatus: StockStatus;
  estimatedCost: number;
  nextBuyerId: string;
  rotationOrder: string[];
  lastPurchasedBy?: string;
  lastPurchasedAt?: Timestamp | null;
  lastExpenseId?: string | null;
}

export interface FixedBill {
  id: string;
  groupId: string;
  title: string; // "Rent", "Wi-Fi", "Electricity", "Maid Salary", "Cook Salary"
  amount: number;
  dueDay: number; // 1 to 31
  category: string;
  defaultPayerId?: string;
  splitMemberIds: string[];
  lastPaidMonth?: string; // "YYYY-MM"
  lastExpenseId?: string;
  notes?: string;
}

export type PenaltyPotType = "chai" | "pizza" | "biryani" | "party";

export interface GuiltJarPenalty {
  id: string;
  groupId: string;
  culpritId: string;
  culpritName: string;
  reason: string; // "Left AC on with door open", "Skipped water can run", "Left dirty dishes"
  amount: number; // e.g. 20, 50, 100
  createdAt: Timestamp;
  createdBy: string;
  settled: boolean;
  potType: PenaltyPotType;
}

export interface FlatContact {
  id: string;
  groupId: string;
  name: string;
  role: string; // "Landlord", "Water Delivery Guy", "Cook", "Maid", "Plumber", "Wi-Fi Provider", "Electrician"
  phone: string;
  notes?: string;
  upiId?: string;
}
