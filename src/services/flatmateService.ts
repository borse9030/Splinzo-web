import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { expenseService } from "./expenseService";
import {
  WaterDutySchedule,
  WaterCanLevel,
  FlatChore,
  DailyMealAttendance,
  MealChoice,
  SharedPantryItem,
  StockStatus,
  FixedBill,
  GuiltJarPenalty,
  FlatContact,
} from "@/types/flatmate";

/**
 * Strips all `undefined` fields from an object to prevent Firestore setDoc/updateDoc crashes.
 */
function cleanData<T extends Record<string, any>>(data: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Timestamp) &&
      !(value?.constructor?.name === "FieldValue")
    ) {
      sanitized[key] = cleanData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Dispatches push & in-app notifications to members via /api/flatmate/notify
 */
export async function sendFlatmatePushNotification(payload: {
  userIds: string[];
  title: string;
  body: string;
  groupId: string;
  type?: string;
  data?: Record<string, any>;
}): Promise<void> {
  try {
    const res = await fetch("/api/flatmate/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("Failed to dispatch push notification:", await res.text());
    }
  } catch (err) {
    console.error("Error dispatching push notification:", err);
  }
}

export const flatmateService = {
  // =========================================================================
  // 1. WATER CAN DUTY & SCHEDULE
  // =========================================================================

  async getWaterDuty(groupId: string, memberIds: string[]): Promise<WaterDutySchedule> {
    const validMembers = Array.isArray(memberIds) && memberIds.length > 0 ? memberIds : [];
    try {
      const docRef = doc(db, `groups/${groupId}/household`, "water_duty");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        const rotationOrder =
          Array.isArray(data.rotationOrder) && data.rotationOrder.length > 0
            ? data.rotationOrder
            : validMembers;
        const weeklySchedule = { ...(data.weeklySchedule || {}) };
        for (let i = 0; i < 7; i++) {
          if (!weeklySchedule[i.toString()] && rotationOrder.length > 0) {
            weeklySchedule[i.toString()] = rotationOrder[i % rotationOrder.length] || "";
          }
        }
        return {
          id: docSnap.id,
          groupId,
          defaultCost: typeof data.defaultCost === "number" ? data.defaultCost : 40,
          canLevel: data.canLevel || "full",
          currentAssigneeId: data.currentAssigneeId || rotationOrder[0] || "",
          rotationOrder,
          weeklySchedule,
          dayAssignments: data.dayAssignments || {},
          lastCompletedAt: data.lastCompletedAt || null,
          lastCompletedBy: data.lastCompletedBy || null,
          notes: data.notes || "20L Water can from the local RO plant.",
          ...data,
        } as WaterDutySchedule;
      }

      // Default initialization if not yet created
      const initialWeeklySchedule: Record<string, string> = {};
      for (let i = 0; i < 7; i++) {
        initialWeeklySchedule[i.toString()] =
          validMembers.length > 0 ? validMembers[i % validMembers.length] : "";
      }

      const defaultSchedule: WaterDutySchedule = {
        groupId,
        defaultCost: 40,
        canLevel: "full",
        currentAssigneeId: validMembers[0] || "",
        rotationOrder: validMembers,
        weeklySchedule: initialWeeklySchedule,
        dayAssignments: {},
        lastCompletedAt: null,
        lastCompletedBy: null,
        notes: "20L Water can from the local RO plant.",
      };

      try {
        await setDoc(
          docRef,
          cleanData({
            ...defaultSchedule,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      } catch (writeErr) {
        console.warn("Could not save initial water duty to Firestore:", writeErr);
      }

      return defaultSchedule;
    } catch (err) {
      console.error("Error in getWaterDuty:", err);
      const initialWeeklySchedule: Record<string, string> = {};
      for (let i = 0; i < 7; i++) {
        initialWeeklySchedule[i.toString()] =
          validMembers.length > 0 ? validMembers[i % validMembers.length] : "";
      }
      return {
        groupId,
        defaultCost: 40,
        canLevel: "full",
        currentAssigneeId: validMembers[0] || "",
        rotationOrder: validMembers,
        weeklySchedule: initialWeeklySchedule,
        dayAssignments: {},
        lastCompletedAt: null,
        lastCompletedBy: null,
        notes: "20L Water can from the local RO plant.",
      };
    }
  },

  async updateWaterDuty(groupId: string, updates: Partial<WaterDutySchedule>): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/household`, "water_duty");
    await setDoc(docRef, cleanData({ ...updates, updatedAt: serverTimestamp() }), { merge: true });
  },

  async updateWaterTimetable(groupId: string, weeklySchedule: Record<string, string>): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/household`, "water_duty");
    await setDoc(docRef, cleanData({ weeklySchedule, updatedAt: serverTimestamp() }), { merge: true });
  },

  async sendWaterDutyReminder(
    groupId: string,
    assigneeId: string,
    senderName: string,
    assigneeName?: string
  ): Promise<void> {
    await sendFlatmatePushNotification({
      userIds: [assigneeId],
      title: "🚰 Jal Devta Bulawa Aaya Hai! (Your Turn)",
      body: `Bhaiya paani khatam hone wala hai! 💧 ${senderName} sent you a gentle nudge: Today is your turn for 20L water can duty. Jal hi jeevan hai!`,
      groupId,
      type: "water_duty",
      data: { assigneeId, senderName, badge: "BLINKIT_WATER_NUDGE" },
    });
  },

  async swapWaterDuty(
    groupId: string,
    day1: string,
    day2: string,
    user1Id: string,
    user2Id: string,
    user1Name: string,
    user2Name: string,
    reason?: string
  ): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/household`, "water_duty");
    const snap = await getDoc(docRef);
    const data = snap.data() || {};
    const schedule: Record<string, string> = { ...(data.weeklySchedule || {}) };

    schedule[day1] = user2Id;
    schedule[day2] = user1Id;

    const note = `${user1Name} swapped with ${user2Name}${reason ? ` (${reason})` : ""}`;

    await setDoc(
      docRef,
      cleanData({
        weeklySchedule: schedule,
        lastSwapNote: note,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );

    // Notify the flatmate with whom duty was swapped
    sendFlatmatePushNotification({
      userIds: [user2Id],
      title: "🔄 Deal Done: Water Duty Swapped!",
      body: `${user1Name} passed the water can baton to you for day ${day1}! No backing out now dost.`,
      groupId,
      type: "duty_swap",
      data: { day1, day2, user1Id, senderName: user1Name, badge: "DUTY_SWAPPED" },
    });
  },

  async updateWaterCanLevel(
    groupId: string,
    canLevel: WaterCanLevel,
    notifyMemberIds?: string[],
    reporterName?: string,
    assigneeName?: string
  ): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/household`, "water_duty");
    await setDoc(docRef, cleanData({ canLevel, updatedAt: serverTimestamp() }), { merge: true });

    if (canLevel === "empty" && notifyMemberIds && notifyMemberIds.length > 0) {
      sendFlatmatePushNotification({
        userIds: notifyMemberIds,
        title: "🚨 EMERGENCY: Can Sukha Padh Gaya!",
        body: `Flat bana Sahara Desert! 0 drops left in 20L can. ${
          assigneeName ? `${assigneeName}, jaldi se refill karwa do please!` : "Koi toh refill le aao!"
        }`,
        groupId,
        type: "water_duty",
        data: { canLevel: "empty", reporterName: reporterName || "Flatmate", badge: "CAN_EMPTY" },
      });
    }
  },

  async completeWaterCanDuty(
    groupId: string,
    schedule: WaterDutySchedule,
    cost: number,
    paidById: string,
    splitMemberIds: string[],
    currency: string = "INR"
  ): Promise<void> {
    let expenseId: string | null = null;

    if (cost > 0 && splitMemberIds.length > 0) {
      const expense = await expenseService.addExpense(groupId, {
        description: "20L Drinking Water Can 🚰",
        amount: cost,
        payerId: paidById,
        currency,
        category: "Groceries",
        splitBetweenIds: splitMemberIds,
        splitMode: "equal",
        createdBy: paidById,
      });
      expenseId = expense.id;
    }

    // Determine next assignee in rotation order
    let nextAssignee = schedule.currentAssigneeId;
    if (schedule.rotationOrder && schedule.rotationOrder.length > 0) {
      const currentIndex = schedule.rotationOrder.indexOf(schedule.currentAssigneeId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % schedule.rotationOrder.length : 0;
      nextAssignee = schedule.rotationOrder[nextIndex];
    }

    const docRef = doc(db, `groups/${groupId}/household`, "water_duty");
    await setDoc(
      docRef,
      cleanData({
        canLevel: "full",
        currentAssigneeId: nextAssignee,
        lastCompletedAt: serverTimestamp(),
        lastCompletedBy: paidById,
        lastExpenseId: expenseId,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  },

  // =========================================================================
  // 2. FLAT CHORES MATRIX
  // =========================================================================

  async getChores(groupId: string): Promise<FlatChore[]> {
    try {
      const colRef = collection(db, `groups/${groupId}/chores`);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() } as FlatChore));
    } catch (err) {
      console.error("Error in getChores:", err);
      return [];
    }
  },

  async seedDefaultChores(groupId: string, memberIds: string[]): Promise<FlatChore[]> {
    if (memberIds.length === 0) return [];
    const defaults = [
      {
        title: "Garbage & Trash Disposal 🗑️",
        description: "Empty kitchen and room dustbins into the society chute / garbage van.",
        icon: "Trash2",
        frequency: "daily" as const,
        karmaPoints: 10,
      },
      {
        title: "Kitchen Sink & Dishes 🍽️",
        description: "Clear night dishes from the sink and wipe the countertop.",
        icon: "Utensils",
        frequency: "daily" as const,
        karmaPoints: 15,
      },
      {
        title: "Living Room Sweeping & Mopping 🧹",
        description: "Sweep and mop the common hall and balcony.",
        icon: "Sparkles",
        frequency: "alternate_days" as const,
        karmaPoints: 20,
      },
      {
        title: "Washroom & Toilet Deep Clean 🧼",
        description: "Harpic, floor scrub, and empty washroom bin.",
        icon: "Droplets",
        frequency: "weekly" as const,
        karmaPoints: 30,
      },
      {
        title: "Morning Milk & Bread Run 🥛",
        description: "Get packet milk, bread, and curd for breakfast.",
        icon: "Coffee",
        frequency: "daily" as const,
        defaultCost: 70,
        karmaPoints: 10,
      },
      {
        title: "LPG Gas Cylinder Refill ⛽",
        description: "Book HP/Indane cylinder and swap empty with delivery guy.",
        icon: "Flame",
        frequency: "as_needed" as const,
        defaultCost: 950,
        karmaPoints: 25,
      },
    ];

    const results: FlatChore[] = [];
    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i];
      const assignedTo = memberIds[i % memberIds.length];
      const docRef = doc(collection(db, `groups/${groupId}/chores`));
      const chore: Omit<FlatChore, "id"> = {
        groupId,
        title: d.title,
        description: d.description,
        icon: d.icon,
        frequency: d.frequency,
        assignedTo,
        rotationOrder: memberIds,
        status: "pending",
        defaultCost: d.defaultCost || 0,
        karmaPoints: d.karmaPoints,
        lastCompletedAt: null,
        lastCompletedBy: null,
      };
      await setDoc(docRef, cleanData({ ...chore, createdAt: serverTimestamp() }));
      results.push({ id: docRef.id, ...chore });
    }
    return results;
  },

  async addChore(groupId: string, chore: Omit<FlatChore, "id" | "groupId">): Promise<FlatChore> {
    const docRef = doc(collection(db, `groups/${groupId}/chores`));
    const data = cleanData({
      ...chore,
      groupId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data);
    return { id: docRef.id, groupId, ...chore };
  },

  async completeChore(
    groupId: string,
    chore: FlatChore,
    paidCost: number,
    paidById: string,
    splitMemberIds: string[],
    currency: string = "INR"
  ): Promise<void> {
    let expenseId: string | null = null;
    if (paidCost > 0 && splitMemberIds.length > 0) {
      const expense = await expenseService.addExpense(groupId, {
        description: chore.title,
        amount: paidCost,
        payerId: paidById,
        currency,
        category: "Household",
        splitBetweenIds: splitMemberIds,
        splitMode: "equal",
        createdBy: paidById,
      });
      expenseId = expense.id;
    }

    // Rotate assignee
    let nextAssignee = chore.assignedTo;
    if (chore.rotationOrder && chore.rotationOrder.length > 0) {
      const currentIndex = chore.rotationOrder.indexOf(chore.assignedTo);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % chore.rotationOrder.length : 0;
      nextAssignee = chore.rotationOrder[nextIndex];
    }

    const docRef = doc(db, `groups/${groupId}/chores`, chore.id);
    await updateDoc(
      docRef,
      cleanData({
        status: "pending", // Reset to pending for the next assignee!
        assignedTo: nextAssignee,
        lastCompletedAt: serverTimestamp(),
        lastCompletedBy: paidById,
        lastExpenseId: expenseId,
        updatedAt: serverTimestamp(),
      })
    );
  },

  async swapChore(groupId: string, choreId: string, newAssigneeId: string): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/chores`, choreId);
    await updateDoc(
      docRef,
      cleanData({
        assignedTo: newAssigneeId,
        status: "swapped",
        updatedAt: serverTimestamp(),
      })
    );
  },

  // =========================================================================
  // 3. DAILY MEAL ATTENDANCE (COOK / FOOD HEADCOUNT)
  // =========================================================================

  async getMealAttendance(groupId: string, dateStr: string): Promise<DailyMealAttendance> {
    try {
      const docRef = doc(db, `groups/${groupId}/meals`, dateStr);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return { id: snap.id, groupId, date: dateStr, ...snap.data() } as DailyMealAttendance;
      }
    } catch (err) {
      console.error("Error in getMealAttendance:", err);
    }

    return {
      id: dateStr,
      groupId,
      date: dateStr,
      lunch: {},
      dinner: {},
    };
  },

  async setMealChoice(
    groupId: string,
    dateStr: string,
    userId: string,
    mealType: "lunch" | "dinner",
    choice: MealChoice
  ): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/meals`, dateStr);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      await updateDoc(
        docRef,
        cleanData({
          [`${mealType}.${userId}`]: choice,
          updatedAt: serverTimestamp(),
        })
      );
    } else {
      await setDoc(
        docRef,
        cleanData({
          groupId,
          date: dateStr,
          lunch: mealType === "lunch" ? { [userId]: choice } : {},
          dinner: mealType === "dinner" ? { [userId]: choice } : {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    }
  },

  // =========================================================================
  // 4. SHARED PANTRY & "WHO BUYS NEXT?"
  // =========================================================================

  async getPantryItems(groupId: string): Promise<SharedPantryItem[]> {
    try {
      const colRef = collection(db, `groups/${groupId}/pantry`);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() } as SharedPantryItem));
    } catch (err) {
      console.error("Error in getPantryItems:", err);
      return [];
    }
  },

  async seedDefaultPantry(groupId: string, memberIds: string[]): Promise<SharedPantryItem[]> {
    if (memberIds.length === 0) return [];
    const defaults = [
      { name: "Cooking Oil (5L Sunflower)", category: "Cooking", estimatedCost: 750 },
      { name: "Salt, Sugar & Tea Leaves (Chai Patti)", category: "Cooking", estimatedCost: 280 },
      { name: "Dishwash Gel & Scrubber (Vim)", category: "Cleaning", estimatedCost: 160 },
      { name: "Garbage Bags & Bins Covers", category: "Cleaning", estimatedCost: 120 },
      { name: "Toilet Cleaner (Harpic) & Handwash", category: "Toiletries", estimatedCost: 240 },
      { name: "Washing Machine Detergent (Surf Excel)", category: "Cleaning", estimatedCost: 450 },
    ];

    const results: SharedPantryItem[] = [];
    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i];
      const nextBuyerId = memberIds[i % memberIds.length];
      const docRef = doc(collection(db, `groups/${groupId}/pantry`));
      const item: Omit<SharedPantryItem, "id"> = {
        groupId,
        name: d.name,
        category: d.category,
        stockStatus: "in_stock",
        estimatedCost: d.estimatedCost,
        nextBuyerId,
        rotationOrder: memberIds,
        lastPurchasedAt: null,
      };
      await setDoc(docRef, cleanData({ ...item, createdAt: serverTimestamp() }));
      results.push({ id: docRef.id, ...item });
    }
    return results;
  },

  async addPantryItem(
    groupId: string,
    item: Omit<SharedPantryItem, "id" | "groupId">
  ): Promise<SharedPantryItem> {
    const docRef = doc(collection(db, `groups/${groupId}/pantry`));
    const data = cleanData({
      ...item,
      groupId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data);
    return { id: docRef.id, groupId, ...item };
  },

  async updatePantryStock(groupId: string, itemId: string, stockStatus: StockStatus): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/pantry`, itemId);
    await updateDoc(docRef, cleanData({ stockStatus, updatedAt: serverTimestamp() }));
  },

  async markPantryPurchased(
    groupId: string,
    item: SharedPantryItem,
    cost: number,
    paidById: string,
    splitMemberIds: string[],
    currency: string = "INR"
  ): Promise<void> {
    let expenseId: string | null = null;
    if (cost > 0 && splitMemberIds.length > 0) {
      const expense = await expenseService.addExpense(groupId, {
        description: `Pantry: ${item.name} 🛒`,
        amount: cost,
        payerId: paidById,
        currency,
        category: "Groceries",
        splitBetweenIds: splitMemberIds,
        splitMode: "equal",
        createdBy: paidById,
      });
      expenseId = expense.id;
    }

    // Rotate next buyer
    let nextBuyer = item.nextBuyerId;
    if (item.rotationOrder && item.rotationOrder.length > 0) {
      const currentIndex = item.rotationOrder.indexOf(item.nextBuyerId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % item.rotationOrder.length : 0;
      nextBuyer = item.rotationOrder[nextIndex];
    }

    const docRef = doc(db, `groups/${groupId}/pantry`, item.id);
    await updateDoc(
      docRef,
      cleanData({
        stockStatus: "in_stock",
        nextBuyerId: nextBuyer,
        lastPurchasedBy: paidById,
        lastPurchasedAt: serverTimestamp(),
        lastExpenseId: expenseId,
        updatedAt: serverTimestamp(),
      })
    );
  },

  // =========================================================================
  // 5. MONTHLY FIXED BILLS
  // =========================================================================

  async getFixedBills(groupId: string): Promise<FixedBill[]> {
    try {
      const colRef = collection(db, `groups/${groupId}/fixed_bills`);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() } as FixedBill));
    } catch (err) {
      console.error("Error in getFixedBills:", err);
      return [];
    }
  },

  async seedDefaultBills(groupId: string, memberIds: string[]): Promise<FixedBill[]> {
    if (memberIds.length === 0) return [];
    const defaults = [
      { title: "Flat Rent 🏠", amount: 24000, dueDay: 1, category: "Rent" },
      { title: "High-Speed Wi-Fi (Airtel/Jio) 📶", amount: 999, dueDay: 5, category: "Utilities" },
      { title: "Electricity Bill (BESCOM/MSEDCL) ⚡", amount: 1800, dueDay: 15, category: "Utilities" },
      { title: "Society Maintenance 🏢", amount: 2500, dueDay: 10, category: "Maintenance" },
      { title: "Maid Salary 🧹", amount: 3000, dueDay: 1, category: "Services" },
      { title: "Cook Salary 👨‍🍳", amount: 4500, dueDay: 1, category: "Services" },
    ];

    const results: FixedBill[] = [];
    for (const d of defaults) {
      const docRef = doc(collection(db, `groups/${groupId}/fixed_bills`));
      const bill: Omit<FixedBill, "id"> = {
        groupId,
        title: d.title,
        amount: d.amount,
        dueDay: d.dueDay,
        category: d.category,
        defaultPayerId: memberIds[0],
        splitMemberIds: memberIds,
      };
      await setDoc(docRef, cleanData({ ...bill, createdAt: serverTimestamp() }));
      results.push({ id: docRef.id, ...bill });
    }
    return results;
  },

  async seedBachelorEssentials(groupId: string, memberIds: string[]): Promise<void> {
    await Promise.all([
      this.seedDefaultChores(groupId, memberIds),
      this.seedDefaultPantry(groupId, memberIds),
      this.seedDefaultBills(groupId, memberIds),
    ]);
  },

  async addFixedBill(groupId: string, bill: Omit<FixedBill, "id" | "groupId">): Promise<FixedBill> {
    const docRef = doc(collection(db, `groups/${groupId}/fixed_bills`));
    const data = cleanData({
      ...bill,
      groupId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, data);
    return { id: docRef.id, groupId, ...bill };
  },

  async splitFixedBill(
    groupId: string,
    bill: FixedBill,
    amount: number,
    paidById: string,
    splitMemberIds: string[],
    monthStr: string,
    currency: string = "INR"
  ): Promise<void> {
    const expense = await expenseService.addExpense(groupId, {
      description: `${bill.title} (${monthStr})`,
      amount,
      payerId: paidById,
      currency,
      category: bill.category || "Utilities",
      splitBetweenIds: splitMemberIds,
      splitMode: "equal",
      createdBy: paidById,
    });

    const docRef = doc(db, `groups/${groupId}/fixed_bills`, bill.id);
    await updateDoc(
      docRef,
      cleanData({
        lastPaidMonth: monthStr,
        lastExpenseId: expense.id,
        updatedAt: serverTimestamp(),
      })
    );
  },

  // =========================================================================
  // 6. THE BACHELOR GUILT JAR / PENALTY POOL
  // =========================================================================

  async getPenalties(groupId: string): Promise<GuiltJarPenalty[]> {
    const colRef = collection(db, `groups/${groupId}/penalties`);
    const q = query(colRef, orderBy("createdAt", "desc"));
    try {
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() } as GuiltJarPenalty));
    } catch {
      // Fallback if index is missing
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() } as GuiltJarPenalty));
    }
  },

  async addPenalty(
    groupId: string,
    penalty: Omit<GuiltJarPenalty, "id" | "groupId" | "createdAt">
  ): Promise<GuiltJarPenalty> {
    const docRef = doc(collection(db, `groups/${groupId}/penalties`));
    const data = cleanData({
      ...penalty,
      groupId,
      createdAt: serverTimestamp(),
    });
    await setDoc(docRef, data);

    // Notify the penalized member
    if (penalty.culpritId) {
      sendFlatmatePushNotification({
        userIds: [penalty.culpritId],
        title: "🍯 CHALAN KATA! Guilt Jar Penalty 🚨",
        body: `₹${penalty.amount} fine added for "${penalty.reason}". Paap dho lo aur flat fund mein pay karo!`,
        groupId,
        type: "guilt_jar",
        data: { amount: String(penalty.amount), culpritName: penalty.culpritName, badge: "GUILT_JAR_FINE" },
      });
    }

    return {
      id: docRef.id,
      groupId,
      ...penalty,
      createdAt: Timestamp.now(),
    };
  },

  async settlePenalty(groupId: string, penaltyId: string): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/penalties`, penaltyId);
    await updateDoc(docRef, cleanData({ settled: true, updatedAt: serverTimestamp() }));
  },

  // =========================================================================
  // 7. FLAT CONTACTS DIRECTORY
  // =========================================================================

  async getContacts(groupId: string): Promise<FlatContact[]> {
    try {
      const colRef = collection(db, `groups/${groupId}/contacts`);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, groupId, ...d.data() } as FlatContact));
    } catch (err) {
      console.error("Error in getContacts:", err);
      return [];
    }
  },

  async addContact(groupId: string, contact: Omit<FlatContact, "id" | "groupId">): Promise<FlatContact> {
    const docRef = doc(collection(db, `groups/${groupId}/contacts`));
    const data = cleanData({ ...contact, groupId, createdAt: serverTimestamp() });
    await setDoc(docRef, data);
    return { id: docRef.id, groupId, ...contact };
  },

  async deleteContact(groupId: string, contactId: string): Promise<void> {
    const docRef = doc(db, `groups/${groupId}/contacts`, contactId);
    await deleteDoc(docRef);
  },
};
