import { Timestamp } from "firebase/firestore";

export interface AppUser {
  id: string;
  name: string;
  displayName: string;
  email: string;
  photoUrl: string;
  photoURL?: string;
  phoneNumber?: string;
  phone?: string;
  bio?: string;
  defaultCurrency?: string;
  upiId?: string;
  paymentQrUrl?: string;
  createdAt: Timestamp;
  updatedAt?: any;
}
