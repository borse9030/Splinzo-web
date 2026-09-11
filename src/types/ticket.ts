import { Timestamp } from "firebase/firestore";

export type TicketCategory =
  | "billing_settlement"
  | "group_expense"
  | "bug_report"
  | "account_security"
  | "feedback_feature"
  | "general";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";

export type TicketSource = "web_contact" | "web_dashboard" | "mobile_app";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  source: TicketSource;
  assignedTo: {
    uid: string;
    name: string;
    email: string;
  } | null;
  deviceInfo?: {
    platform?: "android" | "ios" | "web";
    appVersion?: string;
    osVersion?: string;
    browser?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastReplyAt: Timestamp;
  lastReplyBy: "user" | "staff" | "system";
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "staff" | "admin" | "system";
  content: string;
  attachments?: string[];
  isInternalNote: boolean;
  createdAt: Timestamp;
}
