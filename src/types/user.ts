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
  role?: "user" | "support_staff" | "admin" | "super_admin";
  createdAt: Timestamp;
  updatedAt?: any;
}
