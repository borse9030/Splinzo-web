"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ticketService } from "@/services/ticketService";
import { SupportTicket } from "@/types/ticket";
import {
  LifeBuoy,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Users,
  Search,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = ticketService.subscribeToAllTickets((allTickets) => {
      setTickets(allTickets);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Compute Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress" || t.status === "waiting_on_user").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
  const urgentCount = tickets.filter(t => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed").length;
  const paymentIssues = tickets.filter(t => t.category === "billing_settlement" && t.status !== "resolved" && t.status !== "closed");

  // Urgent tickets requiring staff action
  const urgentTickets = tickets
    .filter(t => (t.priority === "urgent" || t.category === "billing_settlement") && t.status !== "resolved" && t.status !== "closed")
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Open</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">In Progress</span>;
      case "waiting_on_user":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Waiting on User</span>;
      case "resolved":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600">
            Platform Command Center
          </span>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mt-1">Support & Operations Overview</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time monitoring of customer inquiries, UPI settlements, and platform health.
          </p>
        </div>

        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-[#F9B912] text-gray-950 shadow-sm hover:brightness-105 transition-all shrink-0"
        >
          <span>Open Ticket Matrix</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tickets */}
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Tickets</span>
            <div className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <LifeBuoy size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 font-mono">{loading ? "…" : openCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Awaiting staff first response</div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">In Progress</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 font-mono">{loading ? "…" : inProgressCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Currently being handled</div>
        </div>

        {/* Urgent Issues */}
        <div className="p-5 rounded-3xl bg-white border border-red-200/70 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Urgent Disputes</span>
            <div className="h-8 w-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-red-600 font-mono">{loading ? "…" : urgentCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">High priority or settlement issues</div>
        </div>

        {/* Resolved */}
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 font-mono">{loading ? "…" : resolvedCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Total inquiries solved</div>
        </div>
      </div>

      {/* ── URGENT TRIAGE SECTION ── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-gray-900">Priority Settlement & Dispute Queue</h2>
          </div>
          <Link href="/admin/tickets?priority=urgent" className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline">
            View All ({urgentTickets.length}) →
          </Link>
        </div>

        {urgentTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            ✅ No urgent disputes pending. All critical queries are resolved!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Ticket ID</th>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {urgentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 font-mono text-amber-700 font-bold">
                      #{t.ticketNumber}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-gray-900">{t.userName}</div>
                      <div className="text-[10px] text-gray-500">{t.userEmail}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="capitalize text-gray-700">
                        {t.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-700 max-w-xs truncate">
                      {t.subject}
                    </td>
                    <td className="py-3.5">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] transition-colors"
                      >
                        Respond
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

      {/* ── QUICK ACTIONS & CATEGORY BREAKDOWN ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Inquiry Distribution</h3>
          <div className="space-y-3">
            {[
              { label: "Billing & Settlement", key: "billing_settlement", icon: "💳" },
              { label: "Group & Expenses", key: "group_expense", icon: "👥" },
              { label: "Bug Reports", key: "bug_report", icon: "🐛" },
              { label: "Account & Security", key: "account_security", icon: "🔒" },
              { label: "Feature Feedback", key: "feedback_feature", icon: "💡" },
            ].map(cat => {
              const count = tickets.filter(t => t.category === cat.key).length;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="font-mono text-gray-500 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Quick Guide */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert size={16} />
              Standard Operating Procedure
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Dispute Resolution Protocol</h3>
            <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <li>• <strong>UPI Settlement Disputes:</strong> Check Setu transaction ID or official bank UTR against user&apos;s account before marking settled.</li>
              <li>• <strong>Internal Notes:</strong> Always leave an internal note before handing off or escalating a ticket to an admin.</li>
              <li>• <strong>Sensitive Data:</strong> Never ask users for OTPs, ATM PINs, or UPI security credentials.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <Link
              href="/admin/tickets"
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-center text-xs font-bold text-gray-800 transition-colors"
            >
              Browse All Tickets
            </Link>
            <Link
              href="/admin/users"
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-center text-xs font-bold text-gray-800 transition-colors"
            >
              Search Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
