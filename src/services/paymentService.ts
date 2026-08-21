import { db } from "@/lib/firebase/config";
import { collection, doc, updateDoc, query, where, getDocs } from "firebase/firestore";

export const paymentService = {
  /**
   * Approves a payment and updates its status in Firestore
   */
  async approvePayment(paymentId: string): Promise<void> {
    const paymentRef = doc(db, "payments", paymentId);
    await updateDoc(paymentRef, {
      status: "approved",
      approvedAt: new Date(), 
    });
  },

  /**
   * Fetches pending payments for a specific user within a group
   */
  async getPendingPaymentsForUser(groupId: string, userId: string) {
    const q = query(
      collection(db, "payments"),
      where("groupId", "==", groupId),
      where("toUserId", "==", userId),
      where("status", "==", "pending_approval")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
