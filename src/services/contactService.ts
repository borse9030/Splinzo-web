import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Group, GroupMember } from "@/types/group";
import { Expense } from "@/types/expense";

export interface SplinzoContact {
  id: string;
  displayName: string;
  phoneNumber: string;
  normalizedPhone: string;
  isRegistered: boolean;
  registeredUid?: string;
  registeredAvatarUrl?: string;
  upiId?: string;
  email?: string;
}

export interface ContactSplitItem {
  expenseId: string;
  groupId: string;
  groupName: string;
  description: string;
  totalAmount: number;
  currency: string;
  myShare: number;
  contactShare: number;
  payerId: string;
  payerName: string;
  didIPay: boolean;
  didContactPay: boolean;
  netImpact: number; // positive => contact owes you, negative => you owe contact
  createdAt: Date;
  category: string;
}

export interface ContactSplitSummary {
  netBalance: number;
  totalYouOwe: number;
  totalTheyOwe: number;
  theyOweYou: boolean;
  youOweThem: boolean;
  isSettled: boolean;
  splits: ContactSplitItem[];
  sharedGroupNames: string[];
}

export const contactPhoneNormalizer = {
  normalize(rawPhone: string): string {
    if (!rawPhone) return "";
    let digitsOnly = rawPhone.replace(/\D/g, "");
    if (!digitsOnly) return "";

    // If starts with 91 and has 12 digits (Indian mobile)
    if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      return digitsOnly.substring(2);
    }
    // If starts with 0 and has 11 digits
    if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
      return digitsOnly.substring(1);
    }
    if (digitsOnly.length > 10 && digitsOnly.startsWith("91")) {
      return digitsOnly.substring(digitsOnly.length - 10);
    }
    return digitsOnly;
  },

  formatForDisplay(phone: string): string {
    const cleaned = (phone || "").trim();
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length === 10) {
      return `${digits.substring(0, 5)} ${digits.substring(5)}`;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      return `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
    }
    return cleaned || "No phone";
  },
};

export const contactService = {
  /**
   * Reads contacts from the browser using the native Contact Picker API if supported
   */
  async requestBrowserContacts(): Promise<SplinzoContact[]> {
    if (typeof window !== "undefined" && "contacts" in navigator && "select" in (navigator as any).contacts) {
      try {
        const props = ["name", "tel"];
        const opts = { multiple: true };
        const contacts = await (navigator as any).contacts.select(props, opts);

        const list: SplinzoContact[] = [];
        for (let i = 0; i < contacts.length; i++) {
          const c = contacts[i];
          const name = Array.isArray(c.name) ? c.name[0] : c.name || "Contact";
          const rawPhone = Array.isArray(c.tel) ? c.tel[0] : c.tel || "";
          const normalized = contactPhoneNormalizer.normalize(rawPhone);
          if (!normalized) continue;

          list.push({
            id: `browser_${i}_${normalized}`,
            displayName: name,
            phoneNumber: rawPhone,
            normalizedPhone: normalized,
            isRegistered: false,
          });
        }
        return list;
      } catch (err) {
        console.warn("Contact Picker API cancelled or denied:", err);
      }
    }
    return [];
  },

  /**
   * Fetches registered Splinzo users to cross-reference with contacts
   */
  async fetchRegisteredUsersMap(): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        const data = d.data();
        data.uid = d.id;
        const rawPhone = data.phoneNumber || data.phone;
        if (rawPhone) {
          const norm = contactPhoneNormalizer.normalize(rawPhone);
          if (norm) {
            map.set(norm, data);
          }
        }
      });
    } catch (e) {
      console.error("Error fetching registered users for contacts:", e);
    }
    return map;
  },

  /**
   * Aggregates all splits and calculates net balance with a specific contact
   */
  async getContactSplitSummary(
    currentUserId: string,
    contact: SplinzoContact
  ): Promise<ContactSplitSummary> {
    if (!currentUserId) {
      return {
        netBalance: 0,
        totalYouOwe: 0,
        totalTheyOwe: 0,
        theyOweYou: false,
        youOweThem: false,
        isSettled: true,
        splits: [],
        sharedGroupNames: [],
      };
    }

    const contactUid = contact.registeredUid;
    const contactPhone = contact.normalizedPhone;
    const contactNameLower = (contact.displayName || "").toLowerCase().trim();

    try {
      // 1. Fetch all groups current user is a member of
      const groupsQuery = query(
        collection(db, "groups"),
        where("memberIds", "array-contains", currentUserId)
      );
      const groupsSnap = await getDocs(groupsQuery);
      const groups: Group[] = [];
      groupsSnap.forEach((d) => {
        groups.push({ id: d.id, ...d.data() } as Group);
      });

      const allSplits: ContactSplitItem[] = [];
      const sharedGroupNames = new Set<string>();
      let totalYouOwe = 0;
      let totalTheyOwe = 0;

      for (const group of groups) {
        let matchedMember: GroupMember | null = null;
        for (const m of group.members || []) {
          if (m.id === currentUserId) continue;

          if (contactUid && (m.id === contactUid || (m as any).claimedByUid === contactUid)) {
            matchedMember = m;
            break;
          }
          if (contactPhone && (m.id.includes(contactPhone) || (m.email && m.email.includes(contactPhone)))) {
            matchedMember = m;
            break;
          }
          if (group.type === "direct" && (m.name || "").toLowerCase().trim() === contactNameLower) {
            matchedMember = m;
            break;
          }
        }

        if (!matchedMember) continue;

        sharedGroupNames.add(group.type === "direct" ? "1-on-1 Direct Split" : group.name);
        const memberContactId = matchedMember.id;

        // Fetch expenses
        const expQuery = query(collection(db, `groups/${group.id}/expenses`));
        const expSnap = await getDocs(expQuery);
        const expenses: Expense[] = [];
        expSnap.forEach((d) => {
          expenses.push({ id: d.id, ...d.data() } as Expense);
        });

        for (const exp of expenses) {
          const isCurrentUserPayer = exp.payerId === currentUserId;
          const isContactPayer =
            exp.payerId === memberContactId || (Boolean(contactUid) && exp.payerId === contactUid);

          // Calculate shares
          let myShare = 0;
          let contactShare = 0;

          if (exp.customSplitAmounts) {
            myShare = exp.customSplitAmounts[currentUserId] || 0;
            contactShare =
              exp.customSplitAmounts[memberContactId] ||
              (contactUid ? exp.customSplitAmounts[contactUid] || 0 : 0);
          } else if (exp.splitBetweenIds && exp.splitBetweenIds.length > 0) {
            const splitCount = exp.splitBetweenIds.length;
            const equalShare = exp.amount / splitCount;
            if (exp.splitBetweenIds.includes(currentUserId)) myShare = equalShare;
            if (
              exp.splitBetweenIds.includes(memberContactId) ||
              (contactUid && exp.splitBetweenIds.includes(contactUid))
            ) {
              contactShare = equalShare;
            }
          }

          if (isCurrentUserPayer && contactShare > 0.01) {
            totalTheyOwe += contactShare;
            const expDate = exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date();
            allSplits.push({
              expenseId: exp.id,
              groupId: group.id,
              groupName: group.type === "direct" ? "Direct Split" : group.name,
              description: exp.description || "Expense",
              totalAmount: exp.amount,
              currency: exp.currency || "INR",
              myShare,
              contactShare,
              payerId: exp.payerId,
              payerName: "You",
              didIPay: true,
              didContactPay: false,
              netImpact: contactShare,
              createdAt: expDate,
              category: exp.category || "General",
            });
          } else if (isContactPayer && myShare > 0.01) {
            totalYouOwe += myShare;
            const expDate = exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date();
            allSplits.push({
              expenseId: exp.id,
              groupId: group.id,
              groupName: group.type === "direct" ? "Direct Split" : group.name,
              description: exp.description || "Expense",
              totalAmount: exp.amount,
              currency: exp.currency || "INR",
              myShare,
              contactShare,
              payerId: exp.payerId,
              payerName: contact.displayName,
              didIPay: false,
              didContactPay: true,
              netImpact: -myShare,
              createdAt: expDate,
              category: exp.category || "General",
            });
          }
        }
      }

      // Check payments collection for approved settlements
      const payQuery1 = query(
        collection(db, "payments"),
        where("fromUserId", "==", currentUserId),
        where("status", "==", "approved")
      );
      const paySnap1 = await getDocs(payQuery1);
      paySnap1.forEach((d) => {
        const p = d.data();
        if ((contactUid && p.toUserId === contactUid) || p.toUserId === `phone_${contactPhone}`) {
          totalYouOwe = Math.max(0, totalYouOwe - (p.amount || 0));
        }
      });

      const payQuery2 = query(
        collection(db, "payments"),
        where("toUserId", "==", currentUserId),
        where("status", "==", "approved")
      );
      const paySnap2 = await getDocs(payQuery2);
      paySnap2.forEach((d) => {
        const p = d.data();
        if ((contactUid && p.fromUserId === contactUid) || p.fromUserId === `phone_${contactPhone}`) {
          totalTheyOwe = Math.max(0, totalTheyOwe - (p.amount || 0));
        }
      });

      allSplits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const net = totalTheyOwe - totalYouOwe;
      return {
        netBalance: net,
        totalYouOwe,
        totalTheyOwe,
        theyOweYou: net > 0.01,
        youOweThem: net < -0.01,
        isSettled: Math.abs(net) <= 0.01,
        splits: allSplits,
        sharedGroupNames: Array.from(sharedGroupNames),
      };
    } catch (e) {
      console.error("Error aggregating contact split summary:", e);
      return {
        netBalance: 0,
        totalYouOwe: 0,
        totalTheyOwe: 0,
        theyOweYou: false,
        youOweThem: false,
        isSettled: true,
        splits: [],
        sharedGroupNames: [],
      };
    }
  },

  /**
   * Finds or creates a 1-on-1 direct group between current user and the contact
   */
  async getOrCreateDirectGroup(
    currentUserId: string,
    currentUserName: string,
    currentUserEmail: string,
    contact: SplinzoContact
  ): Promise<Group> {
    const contactMemberId = contact.registeredUid || `phone_${contact.normalizedPhone}`;

    const q = query(
      collection(db, "groups"),
      where("type", "==", "direct"),
      where("memberIds", "array-contains", currentUserId)
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const data = d.data();
      const memberIds = data.memberIds || [];
      if (
        memberIds.includes(contactMemberId) ||
        (contact.registeredUid && memberIds.includes(contact.registeredUid))
      ) {
        return { id: d.id, ...data } as Group;
      }
    }

    // Create new direct group
    const newGroupRef = doc(collection(db, "groups"));
    const newGroupData: any = {
      name: contact.displayName,
      description: `1-on-1 split between you and ${contact.displayName}`,
      type: "direct",
      currency: "INR",
      createdBy: currentUserId,
      createdAt: serverTimestamp(),
      memberIds: [currentUserId, contactMemberId],
      members: [
        {
          id: currentUserId,
          name: currentUserName,
          email: currentUserEmail,
          role: "admin",
          joinedAt: Timestamp.now(),
        },
        {
          id: contactMemberId,
          name: contact.displayName,
          email: contact.email || (contact.normalizedPhone ? `${contact.normalizedPhone}@splinzo.local` : ""),
          role: "member",
          joinedAt: Timestamp.now(),
          isShadow: !contact.isRegistered,
          claimedByUid: contact.registeredUid || null,
        },
      ],
    };

    await setDoc(newGroupRef, newGroupData);
    return { id: newGroupRef.id, ...newGroupData } as Group;
  },

  /**
   * Creates a direct split expense between current user and contact
   */
  async createDirectSplit(
    currentUserId: string,
    currentUserName: string,
    currentUserEmail: string,
    contact: SplinzoContact,
    description: string,
    amount: number,
    iPaid: boolean,
    category = "General"
  ): Promise<Expense> {
    if (!contact.isRegistered) {
      throw new Error(
        `Splitting is only allowed with registered Splinzo members. Please invite ${contact.displayName} to join Splinzo first.`
      );
    }

    const group = await this.getOrCreateDirectGroup(
      currentUserId,
      currentUserName,
      currentUserEmail,
      contact
    );
    const contactMemberId = contact.registeredUid || `phone_${contact.normalizedPhone}`;
    const payerId = iPaid ? currentUserId : contactMemberId;
    const half = Number((amount / 2).toFixed(2));

    const expRef = doc(collection(db, `groups/${group.id}/expenses`));
    const expData: any = {
      groupId: group.id,
      description,
      amount,
      payerId,
      currency: "INR",
      createdAt: serverTimestamp(),
      createdBy: currentUserId,
      splitBetweenIds: [currentUserId, contactMemberId],
      customSplitAmounts: {
        [currentUserId]: half,
        [contactMemberId]: half,
      },
      category,
    };

    await setDoc(expRef, expData);
    return { id: expRef.id, ...expData, createdAt: Timestamp.now() } as Expense;
  },
};
