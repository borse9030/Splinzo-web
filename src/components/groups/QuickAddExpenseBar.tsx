"use client";

import { useState } from "react";
import { Sparkles, Send, Check, AlertCircle, Users, User, ArrowRight } from "lucide-react";
import { parseExpenseText, ParsedWebExpense } from "@/lib/nlpExpenseParser";
import { expenseService } from "@/services/expenseService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const AMBER = "#F9B912";

interface QuickAddExpenseBarProps {
  group: any;
  onExpenseAdded?: () => void;
}

export default function QuickAddExpenseBar({ group, onExpenseAdded }: QuickAddExpenseBarProps) {
  const { appUser } = useAuth();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsed: ParsedWebExpense | null = text.trim().length > 2
    ? parseExpenseText(text, group, appUser?.id)
    : null;

  const quickPrompts = [
    "Dinner 1200 paid by me",
    "Uber 350 for all",
    "Groceries 1850",
    "Wi-Fi 999 paid by me",
  ];

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsed || !parsed.amount || parsed.amount <= 0 || !group || !appUser) {
      setErrorMsg("Please include an amount, e.g. 'Dinner 1200'");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const splitBetweenIds = parsed.splitMemberIds.length > 0
        ? parsed.splitMemberIds
        : group.members.map((m: any) => m.id);

      await expenseService.addExpense(group.id, {
        description: parsed.title,
        amount: parsed.amount,
        currency: group.currency || "INR",
        payerId: parsed.payerId || appUser.id,
        splitBetweenIds,
        category: parsed.category,
        splitMode: "equal",
        originalAmount: parsed.amount,
        originalCurrency: group.currency || "INR",
        createdBy: appUser.id,
        isRecurring: false,
      });

      setText("");
      const currencySymbol = group.currency === "INR" ? "₹" : (group.currency || "₹");
      setSuccessMsg(`Logged "${parsed.title}" (${currencySymbol}${parsed.amount})!`);
      setTimeout(() => setSuccessMsg(null), 3500);

      if (onExpenseAdded) onExpenseAdded();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log expense");
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = group?.currency === "INR" ? "₹" : (group?.currency || "₹");

  return (
    <div 
      className="rounded-2xl p-3.5 transition-all shadow-sm border"
      style={{ 
        background: "var(--card)", 
        borderColor: parsed?.amount ? AMBER : "var(--border)" 
      }}
    >
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249, 185, 18, 0.15)" }}>
          <Sparkles className="h-4 w-4" style={{ color: "#D97706" }} />
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Smart Quick Add: 'Dinner 1200 paid by me for Rahul'..."
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
          style={{ color: "var(--foreground)" }}
        />

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !parsed?.amount || parsed.amount <= 0}
          className="h-8 px-3 rounded-xl font-bold text-xs shrink-0 transition-all"
          style={{
            background: parsed?.amount ? AMBER : "var(--muted)",
            color: parsed?.amount ? "#1a1a1a" : "var(--muted-foreground)",
          }}
        >
          {isSubmitting ? "..." : (
            <span className="flex items-center gap-1">
              Add <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </Button>
      </form>

      {/* Quick Prompts */}
      {!parsed && text.length === 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-dashed" style={{ borderColor: "var(--border)" }}>
          <span className="text-[11px] font-semibold text-gray-400 mr-1">Try:</span>
          {quickPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setText(p)}
              className="text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-colors hover:bg-amber-100 hover:text-amber-900"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Live Parsed Preview */}
      {parsed && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "rgba(249, 185, 18, 0.2)", color: "#B45309" }}>
                {parsed.category}
              </span>
              <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>
                {parsed.title}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs flex items-center gap-1 text-gray-500">
                <User className="h-3 w-3" />
                By {parsed.payerName || "You"}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs flex items-center gap-1 text-gray-500">
                <Users className="h-3 w-3" />
                {parsed.splitMemberIds.length === group?.members?.length ? "All" : `${parsed.splitMemberIds.length} people`}
              </span>
            </div>

            <div className="text-sm font-extrabold" style={{ color: parsed.amount ? "#059669" : "#EF4444" }}>
              {parsed.amount ? `${currencySymbol}${parsed.amount.toLocaleString()}` : "Amount missing"}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {successMsg && (
        <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
          <Check className="h-3.5 w-3.5" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mt-2 text-xs font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
