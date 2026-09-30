import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Reminder, ReminderFormData } from "@/types/reminder";

export const reminderService = {
  /**
   * Creates a new custom payment reminder with an active countdown timer.
   */
  async createReminder(params: {
    groupId: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
    currency: string;
    formData: ReminderFormData;
  }): Promise<string> {
    const {
      groupId,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      amount,
      currency,
      formData,
    } = params;

    const reminderId = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const reminderRef = doc(db, "groups", groupId, "reminders", reminderId);

    // Calculate dueAt timestamp
    let dueDate: Date;
    if (formData.customDueDate) {
      dueDate = new Date(formData.customDueDate);
    } else {
      dueDate = new Date(Date.now() + formData.timerDurationHours * 60 * 60 * 1000);
    }

    const reminderData = {
      id: reminderId,
      groupId,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      amount: Number(amount),
      currency: currency || "₹",
      message: formData.message.trim(),
      category: formData.category,
      timerDurationHours: formData.timerDurationHours,
      dueAt: Timestamp.fromDate(dueDate),
      repeatInterval: formData.repeatInterval,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(reminderRef, reminderData);

    // Fire and forget notification to debtor's device
    try {
      const { sendFlatmatePushNotification } = await import("@/services/flatmateService");
      sendFlatmatePushNotification({
        userIds: [fromUserId],
        title: `⏰ Payment Reminder from ${toUserName}`,
        body: `${formData.message.trim()} (Amount: ${currency}${amount})`,
        groupId,
        type: "settlement",
        data: {
          reminderId,
          groupId,
          fromUserId,
          toUserId,
          amount,
          bannerStyle: "urgent",
        },
      }).catch((e) => console.warn("[reminderService] Push notice skipped:", e));
    } catch (_) {}

    return reminderId;
  },

  /**
   * Subscribes to all reminders for a given group in real time.
   */
  subscribeGroupReminders(
    groupId: string,
    callback: (reminders: Reminder[]) => void
  ): () => void {
    const remindersCol = collection(db, "groups", groupId, "reminders");
    const q = query(remindersCol);

    return onSnapshot(
      q,
      (snapshot) => {
        const list: Reminder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Sort by createdAt descending
        list.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return bTime - aTime;
        });
        callback(list);
      },
      (error) => {
        console.error("[reminderService] subscribeGroupReminders error:", error);
        callback([]);
      }
    );
  },

  /**
   * Manually cancels an active reminder timer.
   */
  async cancelReminder(groupId: string, reminderId: string): Promise<void> {
    const ref = doc(db, "groups", groupId, "reminders", reminderId);
    await updateDoc(ref, {
      status: "cancelled",
      settledReason: "cancelled_by_user",
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * CRITICAL: Automatically stops and completes any active reminders for a debt
   * immediately upon successful payment verification.
   */
  async autoStopReminders(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    paymentId?: string
  ): Promise<number> {
    try {
      const colRef = collection(db, "groups", groupId, "reminders");
      const q = query(
        colRef,
        where("fromUserId", "==", fromUserId),
        where("toUserId", "==", toUserId),
        where("status", "==", "active")
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return 0;

      const promises = snapshot.docs.map((docSnap) =>
        updateDoc(docSnap.ref, {
          status: "completed",
          settledReason: "payment_received",
          settledPaymentId: paymentId || "",
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(promises);
      console.log(`[reminderService] Auto-stopped ${snapshot.size} active reminder timer(s).`);
      return snapshot.size;
    } catch (err) {
      console.error("[reminderService] autoStopReminders error:", err);
      return 0;
    }
  },

  /**
   * Formats remaining countdown time from a dueAt timestamp.
   */
  getCountdownDetails(dueAt: any, createdAt: any): {
    formatted: string;
    totalSecondsLeft: number;
    isExpired: boolean;
    progressPercent: number;
  } {
    const targetMs = dueAt?.toMillis ? dueAt.toMillis() : (dueAt ? new Date(dueAt).getTime() : 0);
    const startMs = createdAt?.toMillis ? createdAt.toMillis() : (createdAt ? new Date(createdAt).getTime() : targetMs - 86400000);
    const nowMs = Date.now();

    const diffMs = targetMs - nowMs;
    const isExpired = diffMs <= 0;

    if (isExpired) {
      return {
        formatted: "Timer Expired",
        totalSecondsLeft: 0,
        isExpired: true,
        progressPercent: 100,
      };
    }

    const totalDuration = Math.max(targetMs - startMs, 1000);
    const elapsed = Math.max(nowMs - startMs, 0);
    const progressPercent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = "";
    if (days > 0) {
      formatted = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      formatted = `${minutes}m ${seconds}s`;
    }

    return {
      formatted,
      totalSecondsLeft: totalSeconds,
      isExpired: false,
      progressPercent,
    };
  },
};
