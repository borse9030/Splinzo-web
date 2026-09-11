import { Timestamp } from "firebase/firestore";
import { TicketCategory } from "./ticket";

export type StaffDepartment =
  | "all"
  | "billing_settlement"
  | "group_expense"
  | "bug_report"
  | "account_security"
  | "general";

export interface StaffMember {
  id: string;              // Firestore document ID (e.g. "stf_rahul_123")
  username: string;        // Unique lowercase login handle (e.g. "rahul_support")
  name: string;            // Full name (e.g. "Rahul Sharma")
  email: string;           // Official / assigned email
  password: string;        // Staff password configured by admin
  department: StaffDepartment;
  departmentLabel: string; // e.g. "UPI & Settlement Issues"
  role: "support_staff";
  isActive: boolean;       // Active or Suspended
  assignedCount: number;   // Number of currently assigned active tickets
  resolvedCount: number;   // Total tickets resolved
  createdAt: Timestamp;
  createdBy: string;       // Admin username who created this staff account
  lastLoginAt?: Timestamp;
}

export interface CreateStaffInput {
  username: string;
  name: string;
  email: string;
  password: string;
  department: StaffDepartment;
}

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  all: "All Departments (General)",
  billing_settlement: "UPI & Settlement Issues",
  group_expense: "Groups & Expenses",
  bug_report: "Bug Reports & Technical",
  account_security: "Account & Verification",
  general: "General Inquiries",
};
