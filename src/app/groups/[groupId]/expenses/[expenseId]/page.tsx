"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense } from "@/hooks/useExpense";
import { useGroup } from "@/hooks/useGroup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Receipt, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function ExpenseDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const resolvedParams = use(params);
  const { groupId, expenseId } = resolvedParams;
  const { appUser } = useAuth();
  const { expense, loading: expenseLoading, error: expenseError } = useExpense(groupId, expenseId);
  const { group, loading: groupLoading } = useGroup(groupId);

  if (expenseError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 mt-4">
        <p className="font-medium">Failed to load expense details.</p>
      </div>
    );
  }

  if (expenseLoading || groupLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-bold text-gray-900">Expense not found</h3>
        <Button asChild className="mt-4 rounded-full" style={{ background: AMBER, color: "#1a1a1a" }}>
          <Link href={`/groups/${groupId}`}>Back to Group</Link>
        </Button>
      </div>
    );
  }

  // Find member details
  const payer = group?.members?.find((m: any) => m.id === expense.payerId) || {
    displayName: "Unknown User",
    email: "",
  };
  const payerName = payer.displayName || "Unknown User";

  const dateStr = expense.createdAt
    ? expense.createdAt.toDate().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white shadow-sm">
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </div>
          </Link>
          <h2 className="text-xl font-extrabold text-gray-900">Expense Details</h2>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        {/* Hero: bill image if available, else amber icon */}
        {expense.billImageUrl ? (
          <a href={expense.billImageUrl} target="_blank" rel="noopener noreferrer" className="block relative">
            <img
              src={expense.billImageUrl}
              alt="Bill"
              className="w-full object-cover"
              style={{ maxHeight: "260px", minHeight: "160px" }}
            />
            {/* Tap hint */}
            <div
              className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
            >
              Tap to view full
            </div>
          </a>
        ) : (
          <div
            className="h-24 w-full flex items-center justify-center"
            style={{ background: AMBER_LIGHT }}
          >
            <Receipt className="h-10 w-10" style={{ color: AMBER }} />
          </div>
        )}

        <CardContent className="pt-5 pb-6 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{expense.description}</h1>
          <p className="text-4xl font-extrabold mb-4" style={{ color: AMBER }}>
            {expense.currency === "INR" ? "₹" : expense.currency} {expense.amount.toFixed(2)}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <Calendar className="h-4 w-4" />
            <span>Added on {dateStr}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payer and Split Details */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Paid By</h3>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                style={{ background: "#4CAF50" }}
              >
                {payerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{payerName}</p>
                <p className="text-xs text-gray-500 font-medium">Paid the full amount</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Split Between</h3>
            <div className="space-y-3">
              {expense.splitBetweenIds.map((userId) => {
                const member = group?.members?.find((m: any) => m.id === userId) || {
                  displayName: "Unknown User",
                };
                const memberName = member.displayName || "Unknown User";

                let shareAmount = 0;
                if (expense.customSplitAmounts && expense.customSplitAmounts[userId]) {
                  shareAmount = expense.customSplitAmounts[userId];
                } else {
                  shareAmount = expense.amount / expense.splitBetweenIds.length;
                }

                const isMe = userId === appUser?.id;

                return (
                  <div key={userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center font-bold shadow-sm text-sm"
                        style={isMe ? { background: AMBER, color: "#1a1a1a" } : { background: "#F5F5F5", color: "#666" }}
                      >
                        {memberName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm text-gray-900">
                        {memberName} {isMe && "(You)"}
                      </p>
                    </div>
                    <p className="font-bold text-sm text-gray-900">
                      ₹{shareAmount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
