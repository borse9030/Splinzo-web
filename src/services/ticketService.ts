import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  SupportTicket,
  TicketMessage,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketSource,
} from "@/types/ticket";

export interface CreateTicketParams {
  userId?: string | null;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  source?: TicketSource;
  deviceInfo?: {
    platform?: "android" | "ios" | "web";
    appVersion?: string;
    osVersion?: string;
    browser?: string;
  };
}

function generateTicketNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const dateSegment = Date.now().toString().slice(-3);
  return `SP-${random}-${dateSegment}`;
}

export const ticketService = {
  /**
   * Create a new support ticket and its first root message
   */
  async createTicket(params: CreateTicketParams): Promise<SupportTicket> {
    const ticketRef = doc(collection(db, "support_tickets"));
    const ticketId = ticketRef.id;
    const now = Timestamp.now();
    const ticketNumber = generateTicketNumber();

    const ticketData: SupportTicket = {
      id: ticketId,
      ticketNumber,
      userId: params.userId || null,
      userName: params.userName.trim(),
      userEmail: params.userEmail.trim().toLowerCase(),
      userPhone: params.userPhone?.trim() || "",
      subject: params.subject.trim(),
      message: params.message.trim(),
      category: params.category || "general",
      priority: params.priority || "medium",
      status: "open",
      source: params.source || "web_contact",
      assignedTo: null,
      deviceInfo: params.deviceInfo || { platform: "web" },
      createdAt: now,
      updatedAt: now,
      lastReplyAt: now,
      lastReplyBy: "user",
    };

    await setDoc(ticketRef, ticketData);

    // Add initial message to subcollection
    const messagesRef = collection(db, `support_tickets/${ticketId}/messages`);
    const initialMsg: Omit<TicketMessage, "id"> = {
      senderId: params.userId || "visitor",
      senderName: params.userName.trim(),
      senderRole: "user",
      content: params.message.trim(),
      isInternalNote: false,
      createdAt: now,
    };
    await addDoc(messagesRef, initialMsg);

    return ticketData;
  },

  /**
   * Get single ticket by ID
   */
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    const ticketSnap = await getDoc(doc(db, "support_tickets", ticketId));
    if (!ticketSnap.exists()) return null;
    return ticketSnap.data() as SupportTicket;
  },

  /**
   * Real-time listener for a single ticket
   */
  subscribeToTicket(ticketId: string, callback: (ticket: SupportTicket | null) => void) {
    return onSnapshot(doc(db, "support_tickets", ticketId), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as SupportTicket);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Real-time listener for all tickets (Staff / Admin Panel)
   */
  subscribeToAllTickets(callback: (tickets: SupportTicket[]) => void) {
    const q = query(collection(db, "support_tickets"), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => {
      const tickets: SupportTicket[] = [];
      snap.forEach((doc) => {
        tickets.push(doc.data() as SupportTicket);
      });
      callback(tickets);
    });
  },

  /**
   * Real-time listener for a specific user's tickets (Customer Dashboard)
   */
  subscribeToUserTickets(userId: string, callback: (tickets: SupportTicket[]) => void) {
    const q = query(
      collection(db, "support_tickets"),
      where("userId", "==", userId)
    );
    return onSnapshot(q, (snap) => {
      const tickets: SupportTicket[] = [];
      snap.forEach((doc) => {
        tickets.push(doc.data() as SupportTicket);
      });
      // Sort client-side by updatedAt to avoid complex composite indexing
      tickets.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      callback(tickets);
    });
  },

  /**
   * Real-time listener for conversation messages in a ticket
   */
  subscribeToMessages(ticketId: string, callback: (messages: TicketMessage[]) => void) {
    const q = query(
      collection(db, `support_tickets/${ticketId}/messages`),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      const msgs: TicketMessage[] = [];
      snap.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as TicketMessage);
      });
      callback(msgs);
    });
  },

  /**
   * Send a reply or post an internal staff note
   */
  async addMessage(
    ticketId: string,
    senderId: string,
    senderName: string,
    senderRole: "user" | "staff" | "admin" | "system",
    content: string,
    isInternalNote: boolean = false,
    attachments: string[] = []
  ): Promise<void> {
    const now = Timestamp.now();
    const messagesRef = collection(db, `support_tickets/${ticketId}/messages`);

    await addDoc(messagesRef, {
      senderId,
      senderName,
      senderRole,
      content: content.trim(),
      attachments,
      isInternalNote,
      createdAt: now,
    });

    // Update ticket metadata if it's a public reply
    if (!isInternalNote) {
      const ticketRef = doc(db, "support_tickets", ticketId);
      const isStaff = senderRole === "staff" || senderRole === "admin";
      
      await updateDoc(ticketRef, {
        updatedAt: now,
        lastReplyAt: now,
        lastReplyBy: isStaff ? "staff" : "user",
        // If staff replies, move to waiting_on_user, if user replies, move to open/in_progress
        ...(isStaff ? { status: "waiting_on_user" } : { status: "in_progress" }),
      });
    } else {
      // Just update updatedAt
      await updateDoc(doc(db, "support_tickets", ticketId), {
        updatedAt: now,
      });
    }
  },

  /**
   * Update ticket status
   */
  async updateStatus(ticketId: string, status: TicketStatus): Promise<void> {
    const ticketRef = doc(db, "support_tickets", ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Update ticket priority
   */
  async updatePriority(ticketId: string, priority: TicketPriority): Promise<void> {
    const ticketRef = doc(db, "support_tickets", ticketId);
    await updateDoc(ticketRef, {
      priority,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Assign ticket to a staff member
   */
  async assignTicket(
    ticketId: string,
    staff: { uid: string; name: string; email: string } | null
  ): Promise<void> {
    const ticketRef = doc(db, "support_tickets", ticketId);
    await updateDoc(ticketRef, {
      assignedTo: staff,
      updatedAt: Timestamp.now(),
    });
  },
};
