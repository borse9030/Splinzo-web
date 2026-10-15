import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Group, GroupMember } from "@/types/group";
import { Expense } from "@/types/expense";
import { sendFlatmatePushNotification } from "@/services/flatmateService";

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

export interface ContactSettlementRecord {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  createdAt: Date;
  didIPay: boolean;
}

export interface ContactSplitSummary {
  netBalance: number;
  totalYouOwe: number;
  totalTheyOwe: number;
  theyOweYou: boolean;
  youOweThem: boolean;
  isSettled: boolean;
  splits: ContactSplitItem[];
  settlements: ContactSettlementRecord[];
  sharedGroupNames: string[];
  connectionStatus?: "none" | "pending_sent" | "pending_received" | "accepted";
  directGroupId?: string;
  requestedBy?: string;
  requestedByName?: string;
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

// In-memory cache for registered users phone map to avoid querying the full users table
let cachedRegisteredPhoneMap: Map<string, any> | null = null;
let lastPhoneMapFetchTime = 0;
const PHONE_MAP_CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL

export function invalidateRegisteredUsersMapCache() {
  cachedRegisteredPhoneMap = null;
  lastPhoneMapFetchTime = 0;
}

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
   * Fetches registered Splinzo users to cross-reference with contacts.
   * Cached in memory for 15 minutes to eliminate full-table Firestore scans.
   */
  async fetchRegisteredUsersMap(forceRefresh = false): Promise<Map<string, any>> {
    const now = Date.now();
    if (!forceRefresh && cachedRegisteredPhoneMap && (now - lastPhoneMapFetchTime < PHONE_MAP_CACHE_TTL)) {
      return cachedRegisteredPhoneMap;
    }

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
      cachedRegisteredPhoneMap = map;
      lastPhoneMapFetchTime = now;
    } catch (e) {
      console.error("Error fetching registered users for contacts:", e);
      if (cachedRegisteredPhoneMap) return cachedRegisteredPhoneMap;
    }
    return map;
  },

  /**
   * Aggregates all splits and calculates net balance strictly for the 1-on-1 contact
   * Isolated from other shared groups (flat/trip groups remain completely separate).
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
        settlements: [],
        sharedGroupNames: [],
        connectionStatus: "none",
      };
    }

    const contactUid = contact.registeredUid;
    const contactPhone = contact.normalizedPhone;

    try {
      // 1. Check if dedicated 1-on-1 direct group exists
      const directGroup = await this.findDirectGroup(currentUserId, contact);
      if (!directGroup) {
        return {
          netBalance: 0,
          totalYouOwe: 0,
          totalTheyOwe: 0,
          theyOweYou: false,
          youOweThem: false,
          isSettled: true,
          splits: [],
          settlements: [],
          sharedGroupNames: [],
          connectionStatus: "none",
        };
      }

      // Read group doc to inspect connectionStatus
      const groupDocSnap = await getDoc(doc(db, "groups", directGroup.id));
      const groupData = groupDocSnap.exists() ? groupDocSnap.data() : {};
      const rawStatus = groupData.connectionStatus;
      const requestedBy = groupData.requestedBy;
      const requestedByName = groupData.requestedByName;

      let connectionStatus: "none" | "pending_sent" | "pending_received" | "accepted" = "accepted";
      if (rawStatus === "pending") {
        connectionStatus = requestedBy === currentUserId ? "pending_sent" : "pending_received";
      } else if (rawStatus === "declined") {
        connectionStatus = "none";
      } else if (rawStatus === "accepted") {
        connectionStatus = "accepted";
      } else if (!rawStatus) {
        // Grandfather existing groups
        connectionStatus = "accepted";
      }

      const contactMemberId = contactUid || `phone_${contactPhone}`;

      const allSplits: ContactSplitItem[] = [];
      const allSettlements: ContactSettlementRecord[] = [];
      let totalYouOwe = 0;
      let totalTheyOwe = 0;

      // 2. Fetch direct split expenses strictly from this direct group
      const expQuery = query(collection(db, `groups/${directGroup.id}/expenses`));
      const expSnap = await getDocs(expQuery);
      const expenses: Expense[] = [];
      expSnap.forEach((d) => {
        expenses.push({ id: d.id, ...d.data() } as Expense);
      });

      for (const exp of expenses) {
        const isCurrentUserPayer = exp.payerId === currentUserId;
        const isContactPayer =
          exp.payerId === contactMemberId || (Boolean(contactUid) && exp.payerId === contactUid);

        let myShare = 0;
        let contactShare = 0;

        if (exp.customSplitAmounts) {
          myShare = exp.customSplitAmounts[currentUserId] || 0;
          contactShare =
            exp.customSplitAmounts[contactMemberId] ||
            (contactUid ? exp.customSplitAmounts[contactUid] || 0 : 0);
        } else if (exp.splitBetweenIds && exp.splitBetweenIds.length > 0) {
          const splitCount = exp.splitBetweenIds.length;
          const equalShare = exp.amount / splitCount;
          if (exp.splitBetweenIds.includes(currentUserId)) myShare = equalShare;
          if (
            exp.splitBetweenIds.includes(contactMemberId) ||
            (contactUid && exp.splitBetweenIds.includes(contactUid))
          ) {
            contactShare = equalShare;
          }
        } else {
          // Default 50/50
          myShare = exp.amount / 2;
          contactShare = exp.amount / 2;
        }

        const expDate = exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date();

        if (isCurrentUserPayer && contactShare > 0.01) {
          totalTheyOwe += contactShare;
          allSplits.push({
            expenseId: exp.id,
            groupId: directGroup.id,
            groupName: "1-on-1 Direct Split",
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
          allSplits.push({
            expenseId: exp.id,
            groupId: directGroup.id,
            groupName: "1-on-1 Direct Split",
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

      // 3. Fetch direct payments between current user and contact
      const payQuery1 = query(
        collection(db, "payments"),
        where("fromUserId", "==", currentUserId),
        where("status", "==", "approved")
      );
      const paySnap1 = await getDocs(payQuery1);
      paySnap1.forEach((d) => {
        const p = d.data();
        const toId = p.toUserId || "";
        const gId = p.groupId || "";
        const isContactSplit =
          p.paymentType === "contact_split" ||
          p.scope === "direct_contact" ||
          gId === directGroup.id;

        if (
          isContactSplit &&
          ((contactUid && toId === contactUid) ||
            (contactPhone && (toId === `phone_${contactPhone}` || toId.includes(contactPhone))) ||
            gId === directGroup.id)
        ) {
          const amt = p.amount || 0;
          totalYouOwe = Math.max(0, totalYouOwe - amt);
          const paidDate = p.paidAt?.toDate ? p.paidAt.toDate() : (p.createdAt?.toDate ? p.createdAt.toDate() : new Date());
          allSettlements.push({
            id: d.id,
            fromUserId: currentUserId,
            fromUserName: p.fromUserName || "You",
            toUserId: toId,
            toUserName: p.toUserName || contact.displayName,
            amount: amt,
            createdAt: paidDate,
            didIPay: true,
          });
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
        const fromId = p.fromUserId || "";
        const gId = p.groupId || "";
        const isContactSplit =
          p.paymentType === "contact_split" ||
          p.scope === "direct_contact" ||
          gId === directGroup.id;

        if (
          isContactSplit &&
          ((contactUid && fromId === contactUid) ||
            (contactPhone && (fromId === `phone_${contactPhone}` || fromId.includes(contactPhone))) ||
            gId === directGroup.id)
        ) {
          const amt = p.amount || 0;
          totalTheyOwe = Math.max(0, totalTheyOwe - amt);
          const paidDate = p.paidAt?.toDate ? p.paidAt.toDate() : (p.createdAt?.toDate ? p.createdAt.toDate() : new Date());
          allSettlements.push({
            id: d.id,
            fromUserId: fromId,
            fromUserName: p.fromUserName || contact.displayName,
            toUserId: currentUserId,
            toUserName: p.toUserName || "You",
            amount: amt,
            createdAt: paidDate,
            didIPay: false,
          });
        }
      });

      allSplits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      allSettlements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const net = totalTheyOwe - totalYouOwe;
      return {
        netBalance: net,
        totalYouOwe,
        totalTheyOwe,
        theyOweYou: net > 0.01,
        youOweThem: net < -0.01,
        isSettled: Math.abs(net) <= 0.01,
        splits: allSplits,
        settlements: allSettlements,
        sharedGroupNames: ["1-on-1 Direct Split"],
        connectionStatus,
        directGroupId: directGroup.id,
        requestedBy,
        requestedByName,
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
        settlements: [],
        sharedGroupNames: [],
        connectionStatus: "none",
      };
    }
  },

  /**
   * Searches for an existing 1-on-1 direct group between current user and the contact without auto-creating
   */
  async findDirectGroup(
    currentUserId: string,
    contact: SplinzoContact
  ): Promise<Group | null> {
    const contactMemberId = contact.registeredUid || `phone_${contact.normalizedPhone}`;
    const contactPhone = contact.normalizedPhone;
    const contactNameLower = (contact.displayName || "").toLowerCase().trim();

    const q = query(
      collection(db, "groups"),
      where("type", "==", "direct"),
      where("memberIds", "array-contains", currentUserId)
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const data = d.data();
      const memberIds: string[] = data.memberIds || [];
      
      let isMatch = false;
      if (memberIds.includes(contactMemberId)) {
        isMatch = true;
      } else if (contact.registeredUid && memberIds.includes(contact.registeredUid)) {
        isMatch = true;
      } else if (contactPhone && memberIds.includes(`phone_${contactPhone}`)) {
        isMatch = true;
      } else {
        const membersList = data.members || [];
        for (const m of membersList) {
          if (contact.registeredUid && (m.id === contact.registeredUid || m.claimedByUid === contact.registeredUid)) {
            isMatch = true;
            break;
          }
          if (contactPhone && (m.id.includes(contactPhone) || (m.email && m.email.includes(contactPhone)))) {
            isMatch = true;
            break;
          }
          if (contactNameLower && (m.name || "").toLowerCase().trim() === contactNameLower && m.id !== currentUserId) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) {
        if (contact.registeredUid && !memberIds.includes(contact.registeredUid)) {
          memberIds.push(contact.registeredUid);
          await updateDoc(doc(db, "groups", d.id), { memberIds });
        }
        return { id: d.id, ...data } as Group;
      }
    }
    return null;
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
    const existing = await this.findDirectGroup(currentUserId, contact);
    if (existing) return existing;

    const contactMemberId = contact.registeredUid || `phone_${contact.normalizedPhone}`;
    const contactPhone = contact.normalizedPhone;

    // Create new direct group
    const newGroupRef = doc(collection(db, "groups"));
    const allMemberIds = [currentUserId, contactMemberId];
    if (contact.registeredUid && !allMemberIds.includes(contact.registeredUid)) {
      allMemberIds.push(contact.registeredUid);
    }
    if (contactPhone && !allMemberIds.includes(`phone_${contactPhone}`)) {
      allMemberIds.push(`phone_${contactPhone}`);
    }

    const newGroupData: any = {
      name: contact.displayName,
      description: `1-on-1 split between you and ${contact.displayName}`,
      type: "direct",
      currency: "INR",
      createdBy: currentUserId,
      createdAt: serverTimestamp(),
      memberIds: allMemberIds,
      connectionStatus: "none",
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
   * Sends a connection request to a registered contact with real-time push & in-app notifications
   */
  async sendConnectionRequest(params: {
    currentUserId: string;
    currentUserName: string;
    currentUserEmail?: string;
    contact: SplinzoContact;
  }): Promise<void> {
    const { currentUserId, currentUserName, currentUserEmail, contact } = params;
    if (!contact.isRegistered || !contact.registeredUid) {
      throw new Error("Connection requests can only be sent to registered Splinzo members.");
    }

    const directGroup = await this.getOrCreateDirectGroup(
      currentUserId,
      currentUserName,
      currentUserEmail || "",
      contact
    );

    await updateDoc(doc(db, "groups", directGroup.id), {
      connectionStatus: "pending",
      requestedBy: currentUserId,
      requestedByName: currentUserName,
      requestedTo: contact.registeredUid,
      requestedAt: serverTimestamp(),
    });

    // Push & in-app notification via /api/flatmate/notify
    await sendFlatmatePushNotification({
      userIds: [contact.registeredUid],
      title: "🤝 Connection Request",
      body: `${currentUserName} wants to connect with you on Splinzo to split expenses and settle bills.`,
      groupId: directGroup.id,
      type: "contact_request",
      data: {
        type: "contact_request",
        requesterUid: currentUserId,
        requesterName: currentUserName,
        directGroupId: directGroup.id,
      },
    });
  },

  /**
   * Accepts an incoming connection request and notifies the requester
   */
  async acceptConnectionRequest(params: {
    directGroupId: string;
    currentUserId: string;
    currentUserName: string;
    requesterUid?: string;
  }): Promise<void> {
    const { directGroupId, currentUserId, currentUserName, requesterUid } = params;
    await updateDoc(doc(db, "groups", directGroupId), {
      connectionStatus: "accepted",
      acceptedAt: serverTimestamp(),
    });

    if (requesterUid && requesterUid !== currentUserId) {
      await sendFlatmatePushNotification({
        userIds: [requesterUid],
        title: "🎉 Connection Request Accepted",
        body: `${currentUserName} accepted your connection request. You can now split expenses and settle bills!`,
        groupId: directGroupId,
        type: "contact_request_accepted",
        data: {
          type: "contact_request_accepted",
          acceptedBy: currentUserId,
          acceptedByName: currentUserName,
          directGroupId,
        },
      });
    }
  },

  /**
   * Declines an incoming connection request
   */
  async declineConnectionRequest(directGroupId: string): Promise<void> {
    await updateDoc(doc(db, "groups", directGroupId), {
      connectionStatus: "declined",
      declinedAt: serverTimestamp(),
    });
  },

  /**
   * Fetches incoming pending connection requests for the current user
   */
  async getIncomingPendingRequests(currentUserId: string): Promise<Array<{
    groupId: string;
    name: string;
    requestedBy: string;
    requestedByName: string;
    requestedAt: any;
  }>> {
    if (!currentUserId) return [];
    try {
      const q = query(
        collection(db, "groups"),
        where("type", "==", "direct"),
        where("memberIds", "array-contains", currentUserId)
      );
      const snap = await getDocs(q);
      const requests: Array<{
        groupId: string;
        name: string;
        requestedBy: string;
        requestedByName: string;
        requestedAt: any;
      }> = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.connectionStatus === "pending" && data.requestedBy !== currentUserId) {
          requests.push({
            groupId: d.id,
            name: data.name || "Contact",
            requestedBy: data.requestedBy,
            requestedByName: data.requestedByName || "Splinzo User",
            requestedAt: data.requestedAt,
          });
        }
      });
      return requests;
    } catch (e) {
      console.error("Error fetching incoming contact requests:", e);
      return [];
    }
  },

  /**
   * Records a settlement payment directly between current user and contact
   */
  async recordDirectPayment(params: {
    currentUserId: string;
    currentUserName: string;
    contact: SplinzoContact;
    amount: number;
    currentUserEmail?: string;
  }): Promise<void> {
    const { currentUserId, currentUserName, contact, amount, currentUserEmail } = params;
    const group = await this.getOrCreateDirectGroup(
      currentUserId,
      currentUserName,
      currentUserEmail || "",
      contact
    );
    const toUserId = contact.registeredUid || `phone_${contact.normalizedPhone}`;

    const payRef = doc(collection(db, "payments"));
    await setDoc(payRef, {
      expenseId: `contact_settlement_${Date.now()}`,
      groupId: group.id,
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      toUserId,
      toUserName: contact.displayName,
      amount,
      status: "approved",
      paymentType: "contact_split",
      isContactDirectPayment: true,
      scope: "direct_contact",
      paidAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      verifiedVia: "direct_contact_settlement",
    });

    // Send push & in-app notification if contact is a registered user
    if (contact.registeredUid) {
      sendFlatmatePushNotification({
        userIds: [contact.registeredUid],
        title: "💸 Direct Settlement Received",
        body: `${currentUserName} recorded a payment of ₹${amount.toFixed(0)} for your 1-on-1 split.`,
        groupId: group.id,
        type: "payment",
        data: {
          paymentType: "contact_split",
          scope: "direct_contact",
          amount: String(amount),
          fromUserId: currentUserId,
          fromUserName: currentUserName,
        },
      }).catch((e) => console.warn("Failed to send contact payment notification:", e));
    }
  },

  /**
   * Fetches cloud-synced contacts from users/{userId}/contacts
   */
  async getCloudContacts(userId: string): Promise<SplinzoContact[]> {
    if (!userId) return [];
    try {
      const q = query(collection(db, `users/${userId}/contacts`));
      const snap = await getDocs(q);
      const list: SplinzoContact[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as SplinzoContact);
      });
      return list;
    } catch (e) {
      console.error("Error fetching cloud contacts:", e);
      return [];
    }
  },

  /**
   * Saves a contact to cloud for sync across mobile and web
   */
  async saveContactToCloud(userId: string, contact: SplinzoContact): Promise<void> {
    if (!userId || !contact.normalizedPhone) return;
    try {
      const contactRef = doc(db, `users/${userId}/contacts`, contact.normalizedPhone);
      await setDoc(
        contactRef,
        {
          id: contact.id,
          displayName: contact.displayName,
          phoneNumber: contact.phoneNumber,
          normalizedPhone: contact.normalizedPhone,
          isRegistered: Boolean(contact.isRegistered),
          registeredUid: contact.registeredUid || null,
          registeredAvatarUrl: contact.registeredAvatarUrl || null,
          upiId: contact.upiId || null,
          email: contact.email || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error saving contact to cloud:", e);
    }
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

    const groupDocSnap = await getDoc(doc(db, "groups", group.id));
    const groupData = groupDocSnap.data();
    if (groupData?.connectionStatus && groupData.connectionStatus !== "accepted") {
      throw new Error("Connection request has not been accepted yet. You can only split after connecting.");
    }

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
