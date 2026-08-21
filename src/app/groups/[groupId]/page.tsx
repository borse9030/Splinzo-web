"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Receipt } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function GroupExpensesPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { appUser } = useAuth();
  const { expenses, loading, error } = useExpenses(resolvedParams.groupId);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 mt-4">
        <AlertCircle className="h-5 w-5" />
        <p className="font-medium">Failed to load expenses.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: AMBER_LIGHT }}
        >
          <Receipt className="h-8 w-8" style={{ color: AMBER }} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No expenses yet</h3>
        <p className="text-gray-400 mt-2 text-sm">Add the first expense to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {expenses.map((expense) => {
        const isPayer = expense.payerId === appUser?.id;
        const isInvolved = expense.splitBetweenIds.includes(appUser?.id || "");

        let statusText = "";
        let statusColor = "text-gray-400";

        if (isPayer && expense.splitBetweenIds.length > 1) {
          statusText = "you paid";
          statusColor = "text-green-500";
        } else if (isInvolved && !isPayer) {
          let myShare = 0;
          if (expense.customSplitAmounts && expense.customSplitAmounts[appUser?.id || ""]) {
            myShare = expense.customSplitAmounts[appUser?.id || ""];
          } else {
            myShare = expense.amount / expense.splitBetweenIds.length;
          }
          statusText = `you owe ${expense.currency === "INR" ? "INR" : expense.currency} ${myShare.toFixed(2)}`;
          statusColor = "text-red-500";
        } else if (isPayer && expense.splitBetweenIds.length === 1 && isInvolved) {
          statusText = "you paid for yourself";
          statusColor = "text-gray-400";
        } else {
          statusText = "—";
          statusColor = "text-gray-300";
        }

        // Format date like app: "Aug 13"
        const dateStr = expense.createdAt
          ? expense.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";

        // Payer name placeholder (ideally fetched from members)
        const payerLabel = isPayer ? "xyz" : "bhavesh";

        return (
          <Link key={expense.id} href={`/groups/${resolvedParams.groupId}/expenses/${expense.id}`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                {/* Amber icon square — matches app */}
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: AMBER_LIGHT }}
                >
                  <Receipt className="h-6 w-6" style={{ color: AMBER }} />
                </div>

                {/* Description + payer info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{expense.description}</h4>
                  <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                    {payerLabel} paid · {dateStr}
                  </p>
                </div>

                {/* Amount + status */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-sm">
                    {expense.currency === "INR" ? "INR" : expense.currency}{" "}
                    {expense.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs font-semibold mt-0.5 ${statusColor}`}>{statusText}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
