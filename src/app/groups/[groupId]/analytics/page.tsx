"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useGroup } from "@/hooks/useGroup";
import { useExpenses } from "@/hooks/useExpenses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PieChart, 
  TrendingUp, 
  ArrowLeft, 
  Repeat, 
  Users, 
  Receipt, 
  Calendar,
  Utensils,
  Plane,
  Home,
  Sparkles,
  ShoppingBag,
  FileText,
  CreditCard
} from "lucide-react";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Food: { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500" },
  Travel: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
  Stay: { bg: "bg-indigo-50", text: "text-indigo-600", bar: "bg-indigo-500" },
  Fun: { bg: "bg-pink-50", text: "text-pink-600", bar: "bg-pink-500" },
  Bills: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
  Shopping: { bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500" },
  General: { bg: "bg-slate-50", text: "text-slate-600", bar: "bg-slate-500" },
};

export default function GroupAnalyticsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { group, loading: groupLoading } = useGroup(resolvedParams.groupId);
  const { expenses, loading: expensesLoading } = useExpenses(resolvedParams.groupId);

  const loading = groupLoading || expensesLoading;

  const stats = useMemo(() => {
    if (!expenses.length) return null;

    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const avg = total / expenses.length;

    // Category breakdown
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || "General";
      catMap[cat] = (catMap[cat] || 0) + (e.amount || 0);
    });

    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Member spending breakdown
    const memberMap: Record<string, number> = {};
    expenses.forEach(e => {
      memberMap[e.payerId] = (memberMap[e.payerId] || 0) + (e.amount || 0);
    });

    const members = Object.entries(memberMap)
      .map(([id, amount]) => {
        const m = group?.members?.find(member => member.id === id);
        return {
          id,
          name: m?.displayName || m?.name || "Member",
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Recurring subscriptions
    const recurring = expenses.filter(e => e.isRecurring);
    const monthlyRecurringTotal = recurring.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      total,
      avg,
      categories,
      members,
      topSpender: members[0],
      topCategory: categories[0],
      recurring,
      monthlyRecurringTotal,
    };
  }, [expenses, group]);

  if (loading || !group) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const curr = group.currency === "INR" ? "₹" : group.currency;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200">
            <Link href={`/groups/${group.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Spending Analytics
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {group.name} • Financial insights & recurring budget
            </p>
          </div>
        </div>
      </div>

      {!stats || expenses.length === 0 ? (
        <Card className="border-none shadow-xs rounded-3xl p-12 text-center bg-white">
          <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Expenses Recorded Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Add shared group expenses to see visual spending breakdowns and category charts.
          </p>
          <Button asChild className="mt-4 rounded-xl font-bold">
            <Link href={`/groups/${group.id}/expenses/new`}>Log First Expense</Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Outlay</span>
              <div className="text-2xl font-black text-slate-900">
                {curr}{stats.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {expenses.length} Total Receipts
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Top Category</span>
              <div className="text-2xl font-black text-slate-900">
                {stats.topCategory ? stats.topCategory.name : "—"}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {stats.topCategory ? `${curr}${stats.topCategory.amount.toFixed(0)} (${stats.topCategory.percentage.toFixed(0)}%)` : "No data"}
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Primary Spender</span>
              <div className="text-2xl font-black text-slate-900 truncate">
                {stats.topSpender ? stats.topSpender.name : "—"}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {stats.topSpender ? `${curr}${stats.topSpender.amount.toFixed(0)} paid` : "No data"}
              </span>
            </div>
          </div>

          {/* Category Breakdown Progress */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-amber-500" />
                Category Breakdown
              </h2>
              <span className="text-xs font-bold text-slate-400">
                {stats.categories.length} Categories
              </span>
            </div>

            <div className="space-y-4">
              {stats.categories.map(cat => {
                const colors = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.General;
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat.name}</span>
                      <span className="text-slate-600 font-mono">
                        {curr}{cat.amount.toFixed(2)} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${Math.max(4, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Member Spending Distribution */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Member Contributions
              </h2>
              <span className="text-xs font-bold text-slate-400">
                Who Paid What
              </span>
            </div>

            <div className="space-y-3">
              {stats.members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border font-black text-xs text-slate-800 flex items-center justify-center shadow-2xs">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{m.percentage.toFixed(0)}% of total group spend</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {curr}{m.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Subscriptions & Bills */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-purple-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Recurring Subscriptions & Bills
                </h2>
              </div>
              {stats.recurring.length > 0 && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {curr}{stats.monthlyRecurringTotal.toFixed(2)}/mo
                </span>
              )}
            </div>

            {stats.recurring.length === 0 ? (
              <p className="text-xs text-slate-400">
                No recurring bills logged yet. When logging an expense (such as WiFi, Rent, or Netflix), toggle &quot;Recurring Expense&quot; to track monthly subscription overhead.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.recurring.map(sub => (
                  <div key={sub.id} className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{sub.description}</p>
                      <p className="text-[10px] text-purple-700 font-semibold capitalize mt-0.5">
                        Repeats {sub.recurringInterval || "monthly"} • Category: {sub.category}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {curr}{sub.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
