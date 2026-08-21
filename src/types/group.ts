import { Timestamp } from "firebase/firestore";

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  photoURL?: string;
  role: string; // 'admin', 'member'
  joinedAt: Timestamp;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  currency: string;
  imageUrl: string;
  createdBy: string;
  createdAt: Timestamp;
  memberIds: string[];
  members: GroupMember[];
}
