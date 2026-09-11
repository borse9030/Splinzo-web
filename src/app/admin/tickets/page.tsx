"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ticketService } from "@/services/ticketService";
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/types/ticket";
import {
  LifeBuoy,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    const unsub = ticketService.subscribeToAllTickets((all) => {
      setTickets(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          t.ticketNumber.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      // Category
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;

      // Priority
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  const handleQuickStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await ticketService.updateStatus(ticketId, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Urgent</span>;
      case "high":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">High</span>;
      case "medium":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">Low</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Support Ticket Matrix</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Triage, assign, and respond to incoming platform support inquiries.
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by ticket #, user name, email, or keywords…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="billing_settlement">UPI & Settlement</option>
            <option value="group_expense">Group & Expenses</option>
            <option value="bug_report">App Glitch / Bug</option>
            <option value="account_security">Account & Security</option>
            <option value="feedback_feature">Feedback & Ideas</option>
            <option value="general">General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white font-medium cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pt-2 border-t border-gray-100">
          {[
            { id: "all", label: "All Tickets" },
            { id: "open", label: "Open" },
            { id: "in_progress", label: "In Progress" },
            { id: "waiting_on_user", label: "Waiting on User" },
            { id: "resolved", label: "Resolved" },
            { id: "closed", label: "Closed" },
          ].map((tab) => {
            const count = tab.id === "all" ? tickets.length : tickets.filter(t => t.status === tab.id).length;
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#F9B912] text-gray-950 shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                  isSelected ? "bg-black/20 text-gray-950" : "bg-gray-200 text-gray-700 font-semibold"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TICKETS TABLE ── */}
      <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            <div className="h-8 w-8 mx-auto rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-2" />
            Loading tickets matrix…
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No support tickets match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-mono uppercase text-[10px] bg-gray-50/60 font-bold">
                  <th className="py-3 px-4 font-semibold">Reference</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Subject & Category</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Updated</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-amber-50/20 transition-colors">
                    {/* Ticket Reference */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      #{t.ticketNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{t.userName}</div>
                      <div className="text-[11px] text-gray-500">{t.userEmail}</div>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-gray-900 truncate">{t.subject}</div>
                      <div className="text-[10px] text-amber-700 uppercase font-bold">
                        {t.category.replace("_", " ")}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      {getPriorityBadge(t.priority)}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={t.status}
                        onChange={e => handleQuickStatusChange(t.id, e.target.value as TicketStatus)}
                        className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-800 outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_on_user">Waiting on User</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    {/* Updated Time */}
                    <td className="py-3 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                      {t.updatedAt?.toDate ? t.updatedAt.toDate().toLocaleDateString() : "Recent"}
                    </td>

                    {/* Action Link */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
                      >
                        Workspace
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
