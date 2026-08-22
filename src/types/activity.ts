import { Timestamp } from "firebase/firestore";

export interface ActivityLog {
  id: string;
  iconType: string;
  createdByName: string;
  message: string;
  createdAt: Date;
  createdBy: string;
  groupId: string;
}
