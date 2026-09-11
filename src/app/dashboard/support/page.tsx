"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ticketService } from "@/services/ticketService";
import { SupportTicket, TicketMessage, TicketCategory, TicketPriority } from "@/types/ticket";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AMBER = "#F9B912";

const CATEGORIES: { value: TicketCategory; label: string; icon: string }[] = [
  { value: "billing_settlement", label: "UPI & Settlement Issue", icon: "💳" },
  { value: "group_expense", label: "Group / Ledger Query", icon: "👥" },
  { value: "bug_report", label: "App Glitch / Bug", icon: "🐛" },
  { value: "account_security", label: "Account & Login", icon: "🔒" },
  { value: "feedback_feature", label: "Feature Suggestion", icon: "💡" },
  { value: "general", label: "General Question", icon: "❓" },
];

export default function UserSupportPage() {
  const { user, appUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New ticket modal
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory>("billing_settlement");
  const [newPriority, setNewPriority] = useState<TicketPriority>("medium");
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to user tickets
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = ticketService.subscribeToUserTickets(user.uid, (userTickets) => {
      setTickets(userTickets);
      setLoading(false);
      // Keep selected ticket fresh if open
      if (selectedTicket) {
        const updated = userTickets.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    return () => unsub();
  }, [user]);

  // Subscribe to messages when a ticket is opened
  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      return;
    }
    const unsub = ticketService.subscribeToMessages(selectedTicket.id, (msgs) => {
      // Filter out internal notes for end-users
      setMessages(msgs.filter(m => !m.isInternalNote));
    });
    return () => unsub();
  }, [selectedTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSubject.trim() || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      const created = await ticketService.createTicket({
        userId: user.uid,
        userName: appUser?.displayName || appUser?.name || user.displayName || "User",
        userEmail: appUser?.email || user.email || "",
        subject: newSubject,
        message: newMessage,
        category: newCategory,
        priority: newPriority,
        source: "web_dashboard",
      });
      setIsCreating(false);
      setNewSubject("");
      setNewMessage("");
      setSelectedTicket(created);
    } catch (err) {
      console.error("Failed to create ticket:", err);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      await ticketService.addMessage(
        selectedTicket.id,
        user.uid,
        appUser?.displayName || appUser?.name || user.displayName || "User",
        "user",
        replyText,
        false
      );
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">Open</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">In Progress</span>;
      case "waiting_on_user":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">Staff Replied</span>;
      case "resolved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Resolved</span>;
      case "closed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Closed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
               style={{ background: "#FFF8E1", color: "#F9A825" }}>
            <LifeBuoy size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Help & Support</h1>
            <p className="text-sm text-gray-500 font-medium">
              Have an issue with a group expense or UPI settlement? Our team is here to help.
            </p>
          </div>
        </div>

        <button
          onClick={() => { setIsCreating(true); setSelectedTicket(null); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-105 shrink-0"
          style={{ background: AMBER, color: "#1a1a1a" }}
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      {/* ── MAIN CONTENT: TICKETS LIST OR CONVERSATION ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className={`md:col-span-5 space-y-3 ${selectedTicket ? "hidden md:block" : "block"}`}>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Your Support Tickets ({tickets.length})
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-gray-400">Loading your tickets…</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="h-14 w-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3"
                   style={{ background: "#FFF8E1" }}>
                🤝
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No tickets yet</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                Need help with a payment dispute or a calculation? Open a ticket to reach our staff.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-amber-400 text-amber-800 hover:bg-amber-50 transition-colors"
              >
                Create Your First Ticket
              </button>
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTicket(t); setIsCreating(false); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-50/50 border-amber-300 shadow-md"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold text-gray-500">
                      #{t.ticketNumber}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1 mb-1">{t.subject}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{t.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                    <span className="capitalize">{t.category.replace("_", " ")}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {t.updatedAt?.toDate ? t.updatedAt.toDate().toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Conversation or Ticket Creation */}
        <div className="md:col-span-7">
          {isCreating ? (
            /* ── NEW TICKET FORM ── */
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Create Support Ticket</h2>
                  <p className="text-xs text-gray-500">Submit your query directly to our support team</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Issue Category *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => setNewCategory(c.value)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                          newCategory === c.value
                            ? "bg-amber-50 border-amber-400 text-amber-900"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5" htmlFor="subject">
                    Subject / Summary *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="Briefly describe what happened..."
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Priority Level
                  </label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high", "urgent"] as TicketPriority[]).map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                          newPriority === p
                            ? p === "urgent"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-amber-400 text-gray-900 border-amber-400"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5" htmlFor="message">
                    Detailed Description *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    placeholder="Provide details such as group name, settlement amounts, transaction UTR numbers if applicable..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-transform hover:scale-[1.01] disabled:opacity-50"
                  style={{ background: AMBER, color: "#1a1a1a" }}
                >
                  {submitting ? "Submitting Ticket…" : "Submit Support Ticket"}
                </button>
              </form>
            </div>
          ) : selectedTicket ? (
            /* ── TICKET CONVERSATION VIEW ── */
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[640px]">
              {/* Top Bar */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-gray-200 text-gray-600"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-600">
                        #{selectedTicket.ticketNumber}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                      {selectedTicket.subject}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((m) => {
                  const isUser = m.senderRole === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-gray-400">
                          {isUser ? "You" : `Support Team (${m.senderName})`}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-2xl max-w-lg text-sm leading-relaxed ${
                          isUser
                            ? "bg-amber-400 text-gray-950 rounded-br-none shadow-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {selectedTicket.status === "closed" ? (
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs font-semibold text-gray-500">
                  This ticket has been closed. If you need further help, please create a new ticket.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p-3 sm:p-4 border-t border-gray-100 bg-white flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type a response to support…"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-3 rounded-2xl font-bold text-sm shadow-sm transition-transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ background: AMBER, color: "#1a1a1a" }}
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline">Reply</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ── EMPTY STATE ── */
            <div className="hidden md:flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-gray-100 h-[640px] shadow-sm">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl mb-4"
                   style={{ background: "#FFF8E1" }}>
                💬
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Select a ticket</h3>
              <p className="text-xs text-gray-500 max-w-xs">
                Click any ticket on the left to view the live conversation thread and replies from our support staff.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
