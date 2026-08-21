import { Timestamp } from "firebase/firestore";

export interface AppUser {
  id: string;
  name: string;
  displayName: string;
  email: string;
  photoUrl: string;
  createdAt: Timestamp;
}
