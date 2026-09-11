import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { StaffMember, CreateStaffInput, DEPARTMENT_LABELS } from "@/types/staff";

const STAFF_COLLECTION = "staff_members";

export const staffService = {
  /**
   * Check if a username is already taken
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    const cleanUser = username.trim().toLowerCase();
    const q = query(
      collection(db, STAFF_COLLECTION),
      where("username", "==", cleanUser)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  /**
   * Create a new staff member account
   */
  async createStaffMember(
    input: CreateStaffInput,
    createdBy: string = "adminsplinzo147"
  ): Promise<StaffMember> {
    const cleanUser = input.username.trim().toLowerCase();
    if (await this.isUsernameTaken(cleanUser)) {
      throw new Error(`Staff username "${cleanUser}" is already taken.`);
    }

    const newDocRef = doc(collection(db, STAFF_COLLECTION));
    const now = Timestamp.now();

    const staffData: StaffMember = {
      id: newDocRef.id,
      username: cleanUser,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password.trim(),
      department: input.department,
      departmentLabel: DEPARTMENT_LABELS[input.department] || "General Support",
      role: "support_staff",
      isActive: true,
      assignedCount: 0,
      resolvedCount: 0,
      createdAt: now,
      createdBy,
    };

    await setDoc(newDocRef, staffData);
    return staffData;
  },

  /**
   * Real-time subscription to all staff members
   */
  subscribeToAllStaff(callback: (staff: StaffMember[]) => void): () => void {
    const q = query(
      collection(db, STAFF_COLLECTION),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const staffList: StaffMember[] = [];
        snapshot.forEach((docSnap) => {
          staffList.push({ ...docSnap.data(), id: docSnap.id } as StaffMember);
        });
        callback(staffList);
      },
      (error) => {
        console.error("Error subscribing to staff members:", error);
        callback([]);
      }
    );
  },

  /**
   * Authenticate a staff member by username or email and password
   */
  async authenticateStaff(
    loginHandle: string,
    passkey: string
  ): Promise<StaffMember | null> {
    const cleanHandle = loginHandle.trim().toLowerCase();
    const cleanPass = passkey.trim();

    if (!cleanHandle || !cleanPass) return null;

    // Search by username
    const usernameQuery = query(
      collection(db, STAFF_COLLECTION),
      where("username", "==", cleanHandle)
    );
    let snap = await getDocs(usernameQuery);

    // If not found, try search by email
    if (snap.empty) {
      const emailQuery = query(
        collection(db, STAFF_COLLECTION),
        where("email", "==", cleanHandle)
      );
      snap = await getDocs(emailQuery);
    }

    if (snap.empty) return null;

    const staffDoc = snap.docs[0];
    const data = staffDoc.data() as StaffMember;

    if (!data.isActive) {
      throw new Error("This staff account is currently suspended. Contact Admin.");
    }

    if (data.password !== cleanPass) {
      return null;
    }

    // Update lastLoginAt
    await updateDoc(staffDoc.ref, {
      lastLoginAt: Timestamp.now(),
    });

    return { ...data, id: staffDoc.id };
  },

  /**
   * Update active/suspended status
   */
  async updateStaffStatus(id: string, isActive: boolean): Promise<void> {
    const ref = doc(db, STAFF_COLLECTION, id);
    await updateDoc(ref, { isActive });
  },

  /**
   * Update staff password
   */
  async updateStaffPassword(id: string, newPassword: string): Promise<void> {
    const ref = doc(db, STAFF_COLLECTION, id);
    await updateDoc(ref, { password: newPassword.trim() });
  },

  /**
   * Delete staff member
   */
  async deleteStaffMember(id: string): Promise<void> {
    const ref = doc(db, STAFF_COLLECTION, id);
    await deleteDoc(ref);
  },

  /**
   * Update assigned ticket count
   */
  async adjustAssignedCount(id: string, delta: number): Promise<void> {
    const ref = doc(db, STAFF_COLLECTION, id);
    await updateDoc(ref, {
      assignedCount: increment(delta),
    });
  },
};
