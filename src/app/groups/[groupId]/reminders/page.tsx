"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { useExpenses } from "@/hooks/useExpenses";
import { usePayments } from "@/hooks/usePayments";
import { balanceService } from "@/services/balanceService";
import { reminderService } from "@/services/reminderService";
import { Reminder } from "@/types/reminder";
import { SetReminderModal } from "@/components/reminders/SetReminderModal";
import { ActiveReminderCard } from "@/components/reminders/ActiveReminderCard";
import { DebtorReminderAlert } from "@/components/reminders/DebtorReminderAlert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Timer,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BellRing,
  History,
  Scale,
  Users,
} from "lucide-react";

export default function GroupRemindersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { appUser } = useAuth();
  const { group, loading: groupLoading } = useGroup(resolvedParams.groupId);
  const { expenses, loading: expensesLoading } = useExpenses(resolvedParams.groupId);
  const { payments, loading: paymentsLoading } = usePayments(resolvedParams.groupId);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "toPay" | "toCollect" | "history">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

  // Subscribe to real-time reminders
  useEffect(() => {
    if (!resolvedParams?.groupId) return;
    const unsub = reminderService.subscribeGroupReminders(
      resolvedParams.groupId,
      (list) => setReminders(list)
    );
    return () => unsub();
  }, [resolvedParams?.groupId]);

  const loading = groupLoading || expensesLoading || paymentsLoading;

  if (loading || !group) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-2">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  // Calculate simplified debts
  const balances = balanceService.calculateBalances(group.members, expenses, payments);
  const settlements = balanceService.suggestSettlements(balances, group.members);
  const settlementsOwedToMe = settlements.filter((s) => s.toUserId === appUser?.id);
  const settlementsIOwe = settlements.filter((s) => s.fromUserId === appUser?.id);

  const currencySymbol = group.currency === "INR" ? "₹" : group.currency || "₹";

  // Filter reminders
  const activeReminders = reminders.filter((r) => r.status === "active");
  const completedReminders = reminders.filter((r) => r.status === "completed" || r.status === "cancelled");

  const remindersIOwe = activeReminders.filter((r) => r.fromUserId === appUser?.id);
  const remindersOwedToMe = activeReminders.filter((r) => r.toUserId === appUser?.id);

  let displayedReminders: Reminder[] = [];
  if (activeTab === "toPay") {
    displayedReminders = remindersIOwe;
  } else if (activeTab === "toCollect") {
    displayedReminders = remindersOwedToMe;
  } else if (activeTab === "history") {
    displayedReminders = completedReminders;
  } else {
    displayedReminders = activeReminders;
  }

  const totalAmountUnderReminder = activeReminders.reduce((sum, r) => sum + r.amount, 0);

  const handleOpenCreateReminder = (targetSettlement?: any) => {
    if (targetSettlement) {
      setSelectedSettlement(targetSettlement);
    } else if (settlementsOwedToMe.length > 0) {
      setSelectedSettlement(settlementsOwedToMe[0]);
    } else {
      setSelectedSettlement(null);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* ── Top Header Section ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl shadow-amber-500/10 border border-amber-400/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold tracking-wide uppercase">
              <Timer className="w-3.5 h-3.5 animate-pulse text-amber-200" />
              <span>Smart Debt Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Payment Reminders & Timers
            </h1>
            <p className="text-sm sm:text-base text-amber-50/90 max-w-xl font-medium leading-relaxed">
              Send custom reminder notes with automated countdown timers to debtors. Timers automatically stop the moment a payment is verified.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            {settlementsOwedToMe.length > 0 ? (
              <Button
                onClick={() => handleOpenCreateReminder()}
                className="bg-white hover:bg-amber-50 text-slate-900 font-extrabold shadow-lg rounded-2xl h-12 px-6 flex items-center gap-2 border-0 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 text-amber-600" />
                <span>+ Set New Reminder</span>
              </Button>
            ) : (
              <Button
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold rounded-2xl h-12 px-5 backdrop-blur-sm"
              >
                <Link href={`/groups/${resolvedParams.groupId}/settle`}>
                  <Scale className="w-4 h-4 mr-2" />
                  View All Settlements
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Debtor Active Alert Banner (If user owes money with active reminder) ── */}
      {remindersIOwe.length > 0 && (
        <DebtorReminderAlert
          reminders={remindersIOwe}
          onSettleClick={() => {
            window.location.href = `/groups/${resolvedParams.groupId}/settle`;
          }}
        />
      )}

      {/* ── Key Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="rounded-2xl border border-border/70 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Timers</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black text-foreground">{activeReminders.length}</span>
                {activeReminders.length > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/70 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
              <BellRing className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Under Reminder</p>
              <p className="text-2xl font-black text-foreground mt-0.5">
                {currencySymbol}{totalAmountUnderReminder.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/70 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Auto-Stopped (Paid)</p>
              <p className="text-2xl font-black text-foreground mt-0.5">
                {completedReminders.filter((r) => r.settledReason === "payment_received").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Auto-Stop Guarantee Feature Badge ── */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
          <span className="font-extrabold">Instant Auto-Stop Guarantee: </span>
          When any debtor completes a payment via verified UPI (Setu) or manual settlement approval, Splinzo&apos;s real-time payment trigger halts all active reminder countdown timers immediately. No awkward follow-ups.
        </div>
      </div>

      {/* ── Unsettled Debts You Can Remind (Creditor Quick Action Row) ── */}
      {settlementsOwedToMe.length > 0 && (
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">
                Unsettled Balances Owed to You ({settlementsOwedToMe.length})
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">1-Click Reminder Setup</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {settlementsOwedToMe.map((settlement) => {
              const activeReminderForThisDebt = activeReminders.find(
                (r) => r.fromUserId === settlement.fromUserId && r.toUserId === appUser?.id
              );

              return (
                <div
                  key={`${settlement.fromUserId}-${settlement.toUserId}`}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{settlement.fromUserName}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                      owes you {currencySymbol}{settlement.amount.toFixed(2)}
                    </p>
                  </div>

                  {activeReminderForThisDebt ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs font-bold shrink-0">
                      <Timer className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: "6s" }} />
                      <span>Timer Active</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenCreateReminder(settlement)}
                      className="rounded-xl h-8 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0 shadow-sm cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Set Timer
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center justify-between border-b border-border gap-2 pb-1 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Active ({activeReminders.length})
          </button>
          <button
            onClick={() => setActiveTab("toPay")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "toPay"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            You Owe ({remindersIOwe.length})
          </button>
          <button
            onClick={() => setActiveTab("toCollect")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "toCollect"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Owed to You ({remindersOwedToMe.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auto-Stopped / History ({completedReminders.length})</span>
          </button>
        </div>
      </div>

      {/* ── Reminders List ── */}
      {displayedReminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedReminders.map((reminder) => (
            <ActiveReminderCard
              key={reminder.id}
              reminder={reminder}
              groupId={group.id}
              isCreditor={reminder.toUserId === appUser?.id}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border-2 border-dashed border-border bg-card/60 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <Timer className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              {activeTab === "history"
                ? "No completed reminder history yet"
                : "No active payment reminder timers"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeTab === "history"
                ? "Reminders that are auto-stopped upon verified payment will appear here as proof of settlement."
                : "Need someone to settle up? Set a custom reminder note and automated countdown timer with 1-click."}
            </p>
          </div>
          {settlementsOwedToMe.length > 0 && activeTab !== "history" && (
            <Button
              onClick={() => handleOpenCreateReminder()}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl h-11 px-5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Set Custom Reminder Now
            </Button>
          )}
        </div>
      )}

      {/* ── Set Reminder Modal ── */}
      {selectedSettlement && (
        <SetReminderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          groupId={group.id}
          fromUserId={selectedSettlement.fromUserId}
          fromUserName={selectedSettlement.fromUserName}
          toUserId={selectedSettlement.toUserId}
          toUserName={selectedSettlement.toUserName}
          amount={selectedSettlement.amount}
          currency={currencySymbol}
        />
      )}
    </div>
  );
}
