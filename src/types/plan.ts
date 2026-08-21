import { Timestamp } from "firebase/firestore";

export interface TripPlan {
  id: string;
  groupId: string;
  tripId: string;
  title: string;
  date: Timestamp;
  time: string;
  location: string;
  description: string;
  createdByUid: string;
  updatedBy: string;
}
