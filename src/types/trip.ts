import { Timestamp } from "firebase/firestore";

export interface Trip {
  id: string;
  groupId: string;
  title: string;
  destination: string;
  startDate: Timestamp;
  endDate: Timestamp;
  coverImageUrl?: string;
  createdByUid: string;
  updatedBy: string;
}
