"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense } from "@/hooks/useExpense";
import { useGroup } from "@/hooks/useGroup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Receipt, Calendar, User, Zap } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/hooks/usePayments";

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
  const { payments } = usePayments(groupId);

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
    id: "",
    displayName: "Unknown User",
    email: "",
  };
  const payerName = payer.displayName || "Unknown User";

  // Calculate my share if I'm not the payer
  let myShare = 0;
  const amIInvolved = expense.splitBetweenIds.includes(appUser?.id || "");
  const amIPayer = expense.payerId === appUser?.id;
  
  if (amIInvolved && !amIPayer) {
    if (expense.customSplitAmounts && expense.customSplitAmounts[appUser!.id]) {
      myShare = expense.customSplitAmounts[appUser!.id];
    } else {
      myShare = expense.amount / expense.splitBetweenIds.length;
    }
  }

  // Find if there's already a payment for this expense
  const myPaymentToPayer = payments?.find(
    (p) => p.expenseId === expenseId && p.fromUserId === appUser?.id && p.toUserId === payer.id
  );

  const dateStr = expense.createdAt
    ? expense.createdAt.toDate().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="space-y-4 mt-4">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${groupId}`}
          className="h-10 w-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
          style={{ background: AMBER_LIGHT, color: AMBER }}
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Expense Details</h1>
      </div>

      {/* Bill Image / Receipt */}
      {(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gray-50">
          <CardContent className="p-0">
            <img
              src={(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) as string}
              alt="Receipt"
              className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open((expense.billImageUrl || expense.imageUrl || expense.receiptUrl) as string, "_blank")}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gray-50/50">
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full flex items-center justify-center mb-2" style={{ background: AMBER_LIGHT }}>
              <Receipt className="h-6 w-6" style={{ color: AMBER }} />
            </div>
            <p className="text-xs font-semibold text-gray-400">No bill photo attached</p>
          </CardContent>
        </Card>
      )}

      {/* Expense Info Card */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 capitalize tracking-tight">
              {expense.description}
            </h2>
            <p className="text-3xl font-black mt-2 tracking-tight" style={{ color: AMBER }}>
              {expense.currency === "INR" ? "₹" : expense.currency}{expense.amount.toFixed(2)}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-gray-400" />
              <span>
                <strong className="text-gray-900">{payerName}</strong> paid
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Receipt className="h-4 w-4 text-gray-400" />
              <span>Split equally between {expense.splitBetweenIds.length} people</span>
            </div>
          </div>

          {/* Split Breakdown */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Split Breakdown
            </h3>
            <div className="space-y-3">
              {expense.splitBetweenIds.map((userId) => {
                const member = group?.members.find((m: any) => m.id === userId);
                const memberName: string = member?.displayName || member?.name || "Unknown Member";

                let shareAmount = 0;
                if (expense.customSplitAmounts && expense.customSplitAmounts[userId] !== undefined) {
                  shareAmount = expense.customSplitAmounts[userId];
                } else {
                  shareAmount = expense.amount / expense.splitBetweenIds.length;
                }

                const isMe = userId === appUser?.id;
                const isPayerMember = userId === expense.payerId;
                const memberPayment = payments?.find(
                  (p) => p.expenseId === expenseId && p.fromUserId === userId && p.toUserId === payer.id
                );
                const isSettled = isPayerMember || memberPayment?.status === "approved";
                const isVerifying = memberPayment?.status === "pending_approval";

                return (
                  <div key={userId} className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50/70">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center font-bold shadow-sm text-sm"
                        style={isMe ? { background: AMBER, color: "#1a1a1a" } : { background: "#FFFFFF", color: "#666" }}
                      >
                        {memberName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {memberName} {isMe && "(You)"}
                        </p>
                        {isPayerMember ? (
                          <span className="text-[11px] font-bold text-emerald-600">Paid original bill</span>
                        ) : isSettled ? (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            ✓ Settled via UPI
                          </span>
                        ) : isVerifying ? (
                          <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                            ⚡ Verifying with Bank...
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-400">Not settled yet</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">
                        {expense.currency === "INR" ? "₹" : expense.currency}{shareAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Action Bar */}
      {amIInvolved && !amIPayer && myShare > 0 && !myPaymentToPayer && (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-blue-50/50 border border-blue-100">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-1">You owe {payerName}</h3>
            <p className="text-2xl font-extrabold text-blue-600 mb-4">{expense.currency === "INR" ? "₹" : expense.currency}{myShare.toFixed(2)}</p>
            <Button asChild className="w-full rounded-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-md">
              <Link href={`/groups/${group?.id || groupId}/settle`}>
                <Zap className="h-4 w-4 mr-2 fill-amber-400 text-amber-400" />
                Settle & Pay via Automated UPI
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Status Bar for Debtor */}
      {myPaymentToPayer && (
        <Card
          className={`border-none shadow-sm rounded-3xl overflow-hidden ${
            myPaymentToPayer.status === "approved"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <CardContent className="p-6 text-center">
            {myPaymentToPayer.status === "approved" ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                  <span>✓ Verified via UPI</span>
                </div>
                <h3 className="font-extrabold text-emerald-950 text-lg">Settlement Complete</h3>
                <p className="text-sm text-emerald-800 mt-1">
                  You settled your share of {expense.currency === "INR" ? "₹" : expense.currency}{myPaymentToPayer.amount.toFixed(2)} with {payerName}.
                </p>
                {myPaymentToPayer.utr && (
                  <p className="text-xs text-emerald-700 font-mono mt-2 bg-emerald-100/70 inline-block px-3 py-1 rounded-lg">
                    Bank UTR: {myPaymentToPayer.utr}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>Verifying with Bank...</span>
                </div>
                <h3 className="font-extrabold text-blue-950 text-lg">UPI Payment in Progress</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Waiting for instant bank confirmation via Setu UPI. Balances update automatically upon verification.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verified Settlements List for Payer / Creditor */}
      {amIPayer &&
        payments &&
        payments
          .filter((p) => p.expenseId === expenseId && p.status === "approved" && p.toUserId === appUser?.id)
          .map((p) => (
            <Card key={p.id} className="border-emerald-200 bg-emerald-50/70 border shadow-sm rounded-3xl overflow-hidden mt-3">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 mb-1">
                    <span>✓ Automated UPI Settlement</span>
                  </div>
                  <h4 className="font-bold text-emerald-950">{p.fromUserName} settled their share</h4>
                  <p className="text-xs text-emerald-700 font-mono mt-0.5">UTR: {p.utr || "BANK_VERIFIED"}</p>
                </div>
                <span className="text-xl font-black text-emerald-700">{expense.currency === "INR" ? "₹" : expense.currency}{p.amount.toFixed(2)}</span>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}
