"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useGroup } from "@/hooks/useGroup";
import { usePayments } from "@/hooks/usePayments";
import { paymentService } from "@/services/paymentService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Receipt, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";
const AMBER_DARK = "#F9A000";

/* ─── Avatar colour palette ─────────────────────────────── */
const AVATAR_COLORS = ["#E91E63","#9C27B0","#2196F3","#00BCD4","#4CAF50","#FF5722","#FF9800","#607D8B"];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ─── Member Avatar Component ───────────────────────────── */
function MemberAvatar({ photoURL, name, id, size = 32 }: {
  photoURL?: string; name: string; id: string; size?: number;
}) {
  if (photoURL) {
    return (
      <img src={photoURL} alt={name} 
           className="rounded-full object-cover shrink-0 shadow-sm border border-white"
           style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-white"
         style={{ width: size, height: size, background: avatarColor(id), fontSize: size * 0.4 }}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function GroupExpensesPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { appUser } = useAuth();
  const { group } = useGroup(resolvedParams.groupId);
  const { expenses, loading, error } = useExpenses(resolvedParams.groupId);
  const { payments } = usePayments(resolvedParams.groupId);

  const getMember = (id: string) => group?.members?.find((m: any) => m.id === id);

  const pendingApprovals = payments?.filter(
    (p) => p.status === "pending_approval" && p.toUserId === appUser?.id
  ) || [];

  const handleApprove = async (paymentId: string) => {
    try {
      await paymentService.approvePayment(paymentId);
    } catch (err) {
      console.error("Failed to approve payment:", err);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 mt-4 border border-red-100">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="font-medium">Failed to load expenses. Please try again.</p>
      </div>
    );
  }

  if (loading || !group) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl shrink-0" style={{ background: "#F5F0E8" }} />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-1/3 rounded-full" style={{ background: "#F5F0E8" }} />
                <Skeleton className="h-3 w-1/4 rounded-full" style={{ background: "#F5F0E8" }} />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" style={{ background: "#F5F0E8" }} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-3xl mt-4"
           style={{ border: "2px dashed var(--border)", background: "var(--card)" }}>
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm"
          style={{ background: AMBER_LIGHT }}
        >
          <Receipt className="h-8 w-8" style={{ color: AMBER_DARK }} />
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>No expenses yet</h3>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>Add the first expense to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {pendingApprovals.length > 0 && (
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Pending Approvals</h3>
          {pendingApprovals.map(payment => (
            <Card key={payment.id} className="border-amber-200 bg-amber-50 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div>
                  <h4 className="font-bold text-amber-900">
                    {payment.fromUserName} marked a payment of {group.currency === 'INR' ? '₹' : group.currency}{payment.amount.toFixed(2)} as paid.
                  </h4>
                  <p className="text-sm text-amber-700/80 mt-1">Approve this to update group balances.</p>
                </div>
                <Button 
                  onClick={() => handleApprove(payment.id)} 
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
                >
                  Confirm Received
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
      {expenses.map((expense) => {
        const isPayer = expense.payerId === appUser?.id;
        const isInvolved = expense.splitBetweenIds.includes(appUser?.id || "");
        
        const payerMember = getMember(expense.payerId);
        const payerName = payerMember?.name || payerMember?.displayName || "Unknown";
        const payerPhoto = payerMember?.photoURL || payerMember?.photoUrl;
        
        // Payer label: "You" or first name
        const payerLabel = isPayer ? "You" : payerName.split(" ")[0];

        let statusText = "";
        let statusColor = "text-gray-400";
        let statusBg = "bg-gray-100";

        if (isPayer && expense.splitBetweenIds.length > 1) {
          statusText = "you paid";
          statusColor = "text-emerald-600";
          statusBg = "bg-emerald-50";
        } else if (isInvolved && !isPayer) {
          let myShare = 0;
          if (expense.customSplitAmounts && expense.customSplitAmounts[appUser?.id || ""]) {
            myShare = expense.customSplitAmounts[appUser?.id || ""];
          } else {
            myShare = expense.amount / expense.splitBetweenIds.length;
          }
          statusText = `you owe ${expense.currency === "INR" ? "₹" : expense.currency}${myShare.toFixed(2)}`;
          statusColor = "text-red-600";
          statusBg = "bg-red-50";
        } else if (isPayer && expense.splitBetweenIds.length === 1 && isInvolved) {
          statusText = "you paid for yourself";
          statusColor = "text-gray-500";
          statusBg = "bg-gray-100";
        } else {
          statusText = "not involved";
          statusColor = "text-gray-400";
          statusBg = "bg-gray-100";
        }

        const dateStr = expense.createdAt
          ? expense.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";

        return (
          <Link key={expense.id} href={`/groups/${resolvedParams.groupId}/expenses/${expense.id}`} className="block">
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden group relative"
                  style={{ background: "var(--card)" }}>
              {/* Amber hover accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: `linear-gradient(180deg, ${AMBER}, ${AMBER_DARK})` }}
              />
              
              <CardContent className="p-4 flex items-center gap-4">
                {/* Category Icon (fallback to Receipt) */}
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 overflow-hidden"
                  style={{ background: AMBER_LIGHT }}
                >
                  {(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) ? (
                    <img 
                      src={(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) as string} 
                      alt="Bill thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Receipt className="h-6 w-6" style={{ color: AMBER_DARK }} />
                  )}
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold truncate text-sm sm:text-base" style={{ color: "var(--foreground)" }}>
                      {expense.description}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MemberAvatar photoURL={payerPhoto} name={payerName} id={expense.payerId} size={16} />
                    <p className="text-[11px] sm:text-xs font-semibold truncate" style={{ color: "var(--muted-foreground)" }}>
                      <span style={{ color: "var(--foreground)" }}>{payerLabel}</span> paid · {dateStr}
                    </p>
                  </div>
                </div>

                {/* Amount block */}
                <div className="text-right shrink-0 flex flex-col items-end justify-center">
                  <p className="font-black text-sm sm:text-base tracking-tight mb-1" style={{ color: "var(--foreground)" }}>
                    {expense.currency === "INR" ? "₹" : expense.currency}
                    {expense.amount.toFixed(2)}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor} ${statusBg}`}>
                    {statusText}
                  </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
