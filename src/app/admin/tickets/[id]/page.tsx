"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketService } from "@/services/ticketService";
import { staffService } from "@/services/staffService";
import { StaffMember } from "@/types/staff";
import { getCurrentStaffSession } from "@/lib/adminAuth";
import { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from "@/types/ticket";
import {
  ArrowLeft,
  LifeBuoy,
  Clock,
  User,
  ShieldAlert,
  Send,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Copy,
  Sparkles,
  Zap,
} from "lucide-react";

export default function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const router = useRouter();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Composer State
  const [composerMode, setComposerMode] = useState<"public" | "internal">("public");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Staff identity
  const [staffName, setStaffName] = useState("Staff Agent");

  useEffect(() => {
    const session = getCurrentStaffSession();
    if (session?.name) setStaffName(session.name);

    const unsubStaff = staffService.subscribeToAllStaff((staff) => {
      setStaffList(staff);
    });

    return () => unsubStaff();
  }, []);

  // Subscribe to ticket & messages
  useEffect(() => {
    if (!ticketId) return;

    const unsubTicket = ticketService.subscribeToTicket(ticketId, (t) => {
      setTicket(t);
      setLoading(false);
    });

    const unsubMessages = ticketService.subscribeToMessages(ticketId, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubTicket();
      unsubMessages();
    };
  }, [ticketId]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      await ticketService.updateStatus(ticket.id, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    try {
      await ticketService.updatePriority(ticket.id, newPriority);
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket) return;
    const session = getCurrentStaffSession();
    try {
      await ticketService.assignTicket(ticket.id, {
        uid: session?.id || session?.username || "staff-agent",
        name: session?.name || staffName,
        email: session?.email || "staff@splinzo.in",
      });
      if (ticket.status === "open") {
        await ticketService.updateStatus(ticket.id, "in_progress");
      }
    } catch (err) {
      console.error("Failed to assign:", err);
    }
  };

  const handleAssignStaff = async (staff: { uid: string; name: string; email: string } | null) => {
    if (!ticket) return;
    try {
      await ticketService.assignTicket(ticket.id, staff);
      if (staff && ticket.status === "open") {
        await ticketService.updateStatus(ticket.id, "in_progress");
      }
    } catch (err) {
      console.error("Failed to assign staff:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const isInternal = composerMode === "internal";
      const session = getCurrentStaffSession();
      await ticketService.addMessage(
        ticket.id,
        session?.id || session?.username || "staff-agent",
        session?.name || staffName,
        session?.isSuperAdmin ? "admin" : "staff",
        replyText,
        isInternal
      );
      setReplyText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick reply presets
  const applyPreset = (presetText: string) => {
    setReplyText(presetText);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500 text-xs">
        <div className="h-8 w-8 mx-auto rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
        Loading ticket workspace…
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center text-gray-500 space-y-3">
        <div className="text-xl font-bold text-gray-900">Ticket not found</div>
        <Link href="/admin/tickets" className="text-amber-700 text-xs font-bold hover:underline">
          ← Back to Ticket Matrix
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── TOP NAV BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tickets"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-amber-700">
                #{ticket.ticketNumber}
              </span>
              <span className="text-xs text-gray-500 capitalize">• {ticket.category.replace("_", " ")}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{ticket.subject}</h1>
          </div>
        </div>

        {/* Quick status buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(["open", "in_progress", "waiting_on_user", "resolved", "closed"] as TicketStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                ticket.status === s
                  ? "bg-[#F9B912] text-gray-950 shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Conversation Thread (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Conversation Feed */}
          <div className="bg-white border border-gray-200/80 shadow-sm rounded-3xl p-5 sm:p-6 space-y-4 min-h-[420px] max-h-[580px] overflow-y-auto">
            {messages.map((m) => {
              const isUser = m.senderRole === "user";
              const isInternal = m.isInternalNote;

              if (isInternal) {
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-amber-800">
                        <Lock size={12} />
                        INTERNAL STAFF NOTE ({m.senderName})
                      </span>
                      <span className="text-amber-700/80 font-mono text-[10px]">
                        {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap font-medium">
                      {m.content}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-gray-500">
                      {isUser ? `${m.senderName} (Customer)` : `Staff (${m.senderName})`}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200/80"
                        : "bg-[#F9B912] text-gray-950 font-medium rounded-br-none shadow-xs"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── COMPOSER ── */}
          <div className="bg-white border border-gray-200/80 shadow-sm rounded-3xl p-5 space-y-3">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setComposerMode("public")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    composerMode === "public"
                      ? "bg-[#F9B912] text-gray-950 shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Send size={12} />
                  Public Reply (To User)
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode("internal")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    composerMode === "internal"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Lock size={12} />
                  Internal Note (Staff Only)
                </button>
              </div>

              {/* Quick Preset Macros */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500">
                <span>Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset("Hello! We have reviewed your settlement inquiry. The transaction reference has been verified with our banking partner, and your group balance has been reconciled.")}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold transition-colors"
                >
                  Reconciled
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("Hi! Could you please share the 12-digit Bank UTR or Setu transaction reference so our engineering team can inspect the payment logs?")}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold transition-colors"
                >
                  Need UTR
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                required
                rows={4}
                placeholder={
                  composerMode === "public"
                    ? "Type your response to the customer…"
                    : "Add private memo for staff handover, logs, or dispute context…"
                }
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className={`w-full p-4 rounded-2xl text-xs sm:text-sm font-medium outline-none resize-none transition-all ${
                  composerMode === "public"
                    ? "bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:border-amber-400"
                    : "bg-amber-50/50 border border-amber-300 text-amber-950 placeholder-amber-700/60 focus:bg-white focus:border-amber-500"
                }`}
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  {composerMode === "public" ? "User will see this message in app & web." : "Visible strictly to internal staff."}
                </span>

                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all hover:brightness-105 disabled:opacity-50 flex items-center gap-2 bg-[#F9B912] text-gray-950"
                >
                  <Send size={14} />
                  <span>{composerMode === "public" ? "Send Reply" : "Post Note"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Customer Context & Ticket Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Customer Profile Card */}
          <div className="bg-white border border-gray-200/80 shadow-sm rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <User size={14} />
              Customer Information
            </h3>

            <div className="space-y-3 pt-1">
              <div>
                <div className="text-sm font-bold text-gray-900">{ticket.userName}</div>
                <div className="text-xs text-gray-500 font-mono">{ticket.userEmail}</div>
              </div>

              {ticket.userId && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">User ID</div>
                  <div className="text-xs font-mono text-gray-700 truncate">{ticket.userId}</div>
                </div>
              )}

              {ticket.deviceInfo && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Device / Client</div>
                  <div className="text-xs text-gray-700 capitalize">
                    {ticket.deviceInfo.platform || "Web"} • {ticket.source}
                  </div>
                </div>
              )}

              <div className="pt-3">
                <Link
                  href={`/admin/users?q=${encodeURIComponent(ticket.userEmail)}`}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  View User Profile & Groups
                </Link>
              </div>
            </div>
          </div>

          {/* Ticket Metadata Controls */}
          <div className="bg-white border border-gray-200/80 shadow-sm rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <FileText size={14} />
              Ticket Properties
            </h3>

            <div className="space-y-3 text-xs">
              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Priority</label>
                <select
                  value={ticket.priority}
                  onChange={e => handlePriorityChange(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-semibold outline-none focus:border-amber-400 focus:bg-white cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Assigned Agent</label>
                <div className="space-y-2">
                  <select
                    value={ticket.assignedTo?.uid || ""}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (!selectedVal) {
                        handleAssignStaff(null);
                      } else {
                        const found = staffList.find((s) => s.id === selectedVal || s.username === selectedVal);
                        if (found) {
                          handleAssignStaff({ uid: found.id, name: found.name, email: found.email });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-semibold outline-none focus:border-amber-400 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.departmentLabel})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    className="w-full py-2.5 rounded-xl bg-[#F9B912] text-gray-950 font-bold hover:brightness-105 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Zap size={13} />
                    Assign To Me (Claim)
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-500">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-mono text-gray-700 font-semibold">
                    {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Activity:</span>
                  <span className="font-mono text-gray-700 font-semibold">
                    {ticket.lastReplyAt?.toDate ? ticket.lastReplyAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
