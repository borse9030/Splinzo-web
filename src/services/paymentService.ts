import { db } from "@/lib/firebase/config";
import { collection, doc, updateDoc, query, where, getDocs } from "firebase/firestore";

export const paymentService = {
  /**
   * Approves a payment and updates its status in Firestore
   */
  async approvePayment(paymentId: string): Promise<void> {
    const paymentRef = doc(db, "payments", paymentId);
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(paymentRef);
    await updateDoc(paymentRef, {
      status: "approved",
      approvedAt: new Date(), 
    });

    if (snap.exists()) {
      const data = snap.data();
      const toUserId = data.toUserId;
      const fromUserId = data.fromUserId;
      const amount = data.amount || 0;
      const groupId = data.groupId || "";

      // Auto-stop active reminder timers for this settled debt
      if (groupId && fromUserId && toUserId) {
        const { reminderService } = await import("@/services/reminderService");
        reminderService
          .autoStopReminders(groupId, fromUserId, toUserId, paymentId)
          .catch((e) => console.warn("[paymentService] Error auto-stopping reminders:", e));
      }

      const toUserName = data.toUserName || "The receiver";
      if (fromUserId) {
        const { sendFlatmatePushNotification } = await import("@/services/flatmateService");
        sendFlatmatePushNotification({
          userIds: [fromUserId],
          title: "🎉 Payment Verified & Confirmed!",
          body: `Your payment of ₹${amount} to ${toUserName} has been confirmed. Dues have been settled.`,
          groupId,
          type: "settlement",
          data: {
            paymentId,
            fromUserId,
            toUserId,
            amount,
            bannerStyle: "celebration",
          },
        }).catch((e) => console.warn("[paymentService] Push error:", e));
      }
    }
  },

  /**
   * Declines a payment and updates its status to 'declined' in Firestore
   */
  async declinePayment(paymentId: string): Promise<void> {
    const paymentRef = doc(db, "payments", paymentId);
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(paymentRef);
    await updateDoc(paymentRef, {
      status: "declined",
      declinedAt: new Date(),
    });

    if (snap?.exists()) {
      const data = snap.data();
      const fromUserId = data.fromUserId;
      const toUserName = data.toUserName || "The receiver";
      const amount = data.amount || 0;
      const groupId = data.groupId || "";

      if (fromUserId) {
        const { sendFlatmatePushNotification } = await import("@/services/flatmateService");
        sendFlatmatePushNotification({
          userIds: [fromUserId],
          title: "❌ Payment Declined",
          body: `${toUserName} indicated they haven't received your payment of ₹${amount}. Please verify and retry.`,
          groupId,
          type: "settlement",
          data: {
            paymentId,
            fromUserId,
            toUserId: data.toUserId,
            amount,
            bannerStyle: "warning",
          },
        }).catch((e) => console.warn("[paymentService] Push error:", e));
      }
    }
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
