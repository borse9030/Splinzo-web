import { Timestamp } from "firebase/firestore";

export interface AppUser {
  id: string;
  name: string;
  displayName: string;
  email: string;
  photoUrl: string;
  photoURL?: string;
  defaultCurrency?: string;
  upiId?: string;
  paymentQrUrl?: string;
  createdAt: Timestamp;
}
