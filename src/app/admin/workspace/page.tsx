"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SupportTicket, TicketStatus } from "@/types/ticket";
import { ticketService } from "@/services/ticketService";
import { getCurrentStaffSession, CurrentStaffSession } from "@/lib/adminAuth";
import { staffService } from "@/services/staffService";
import {
  Inbox,
  UserCheck,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Shield,
  Briefcase,
} from "lucide-react";

const AMBER = "#F9B912";

const STATUS_BADGES: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  open: { label: "Open", color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
  in_progress: { label: "In Progress", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  waiting_on_user: { label: "Waiting on User", color: "#7E22CE", bg: "#FAF5FF", border: "#E9D5FF" },
  resolved: { label: "Resolved", color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  closed: { label: "Closed", color: "#475569", bg: "#F8FAFC", border: "#E2E8F0" },
};

export default function StaffWorkspacePage() {
  const [session, setSession] = useState<CurrentStaffSession | null>(null);
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assigned" | "department" | "all">("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    setSession(getCurrentStaffSession());

    const unsub = ticketService.subscribeToAllTickets((tickets) => {
      setAllTickets(tickets);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const currentStaffId = session?.id;
  const currentStaffName = session?.name || "Support Staff";
  const currentStaffEmail = session?.email || "";
  const currentDepartment = session?.department || "all";

  // Filter 1: Assigned to Me
  const myAssignedTickets = allTickets.filter((t) => {
    if (!t.assignedTo) return false;
    return (
      (currentStaffId && t.assignedTo.uid === currentStaffId) ||
      (currentStaffEmail && t.assignedTo.email === currentStaffEmail) ||
      t.assignedTo.name === currentStaffName
    );
  });

  // Filter 2: Department Queue (matching category and unassigned)
  const departmentQueue = allTickets.filter((t) => {
    if (t.status === "resolved" || t.status === "closed") return false;
    if (t.assignedTo) return false; // only unassigned
    if (currentDepartment === "all") return true;
    return t.category === currentDepartment;
  });

  // Claim Ticket Handler
  const handleClaimTicket = async (ticket: SupportTicket) => {
    if (!session) return;
    setClaimingId(ticket.id);
    try {
      await ticketService.assignTicket(ticket.id, {
        uid: session.id || session.username,
        name: session.name,
        email: session.email || `${session.username}@splinzo.in`,
      });

      if (ticket.status === "open") {
        await ticketService.updateStatus(ticket.id, "in_progress");
      }

      if (session.id) {
        await staffService.adjustAssignedCount(session.id, 1);
      }
    } catch (err) {
      console.error("Error claiming ticket:", err);
    } finally {
      setClaimingId(null);
    }
  };

  // Select which ticket list to display
  let displayedTickets = allTickets;
  if (activeTab === "assigned") displayedTickets = myAssignedTickets;
  else if (activeTab === "department") displayedTickets = departmentQueue;

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedTickets = displayedTickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ── AGENT WELCOME BANNER ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 border border-amber-200/80 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100/70 text-amber-800 border border-amber-300/60">
              <Briefcase size={13} />
              {session?.departmentLabel || "Operations & Support Specialist"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              Welcome, {currentStaffName} 👋
            </h1>
            <p className="text-xs text-gray-600 max-w-lg leading-relaxed">
              This is your dedicated workspace. Review tickets assigned directly to you, claim unassigned issues from your department queue, and provide customer resolutions.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 bg-white border border-gray-200/80 shadow-sm p-4 rounded-2xl">
            <div className="text-center px-3 border-r border-gray-200">
              <div className="text-2xl font-black text-amber-600">{myAssignedTickets.length}</div>
              <div className="text-[10px] font-bold uppercase text-gray-500">My Active</div>
            </div>
            <div className="text-center px-3 border-r border-gray-200">
              <div className="text-2xl font-black text-sky-600">{departmentQueue.length}</div>
              <div className="text-[10px] font-bold uppercase text-gray-500">In Queue</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-black text-emerald-600">
                {myAssignedTickets.filter((t) => t.status === "resolved").length}
              </div>
              <div className="text-[10px] font-bold uppercase text-gray-500">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE TABS & CONTROLS ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("assigned")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "assigned"
                  ? "bg-[#F9B912] text-gray-950 shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <UserCheck size={14} />
              Assigned to Me ({myAssignedTickets.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("department")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "department"
                  ? "bg-[#F9B912] text-gray-950 shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Zap size={14} />
              Department Queue ({departmentQueue.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-[#F9B912] text-gray-950 shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Inbox size={14} />
              All Platform ({allTickets.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reference or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* ── TICKETS LIST ── */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <div className="h-7 w-7 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-2 font-mono">Loading your workspace queue...</p>
            </div>
          ) : displayedTickets.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-gray-200/80 shadow-sm text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">Queue is Clear!</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {activeTab === "assigned"
                  ? "You have no pending assigned tickets. Check the Department Queue to claim unassigned requests."
                  : "No tickets matching this filter right now."}
              </p>
              {activeTab === "assigned" && departmentQueue.length > 0 && (
                <button
                  onClick={() => setActiveTab("department")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
                >
                  Go to Department Queue ({departmentQueue.length} available) →
                </button>
              )}
            </div>
          ) : (
            displayedTickets.map((ticket) => {
              const statusCfg = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
              const isUnassigned = !ticket.assignedTo;

              return (
                <div
                  key={ticket.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200/80 hover:border-amber-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700">
                        #{ticket.ticketNumber}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
                      >
                        {statusCfg.label}
                      </span>
                      {ticket.priority === "urgent" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                          <AlertCircle size={10} /> Urgent
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500">
                        Category: <strong className="text-gray-700 font-semibold">{ticket.category}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{ticket.subject}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{ticket.message}</p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                      <span>Customer: <strong className="text-gray-800">{ticket.userName}</strong> ({ticket.userEmail})</span>
                      {ticket.assignedTo && (
                        <span>• Assigned to: <strong className="text-amber-700">{ticket.assignedTo.name}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    {isUnassigned && (
                      <button
                        type="button"
                        onClick={() => handleClaimTicket(ticket)}
                        disabled={claimingId === ticket.id}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-[1.02] shadow-xs"
                        style={{ background: AMBER, color: "#111827" }}
                      >
                        {claimingId === ticket.id ? (
                          <div className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <Zap size={13} />
                            Claim Ticket
                          </>
                        )}
                      </button>
                    )}

                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      Open Workspace
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
