"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  Utensils, 
  Coffee, 
  Car, 
  Film, 
  Home, 
  ShoppingBag, 
  Zap, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Info,
  Calendar,
  Sparkles,
  Tag
} from "lucide-react";
import { PairwiseSettlementBreakdown, PairwiseExpenseItem } from "@/services/pairwiseBreakdownService";

interface SettlementBreakdownViewProps {
  breakdown: PairwiseSettlementBreakdown;
  currencySymbol?: string;
  isCurrentUserCreditor?: boolean; // Am I collecting?
  isCurrentUserDebtor?: boolean; // Am I paying?
  defaultOpen?: boolean;
}

function getCategoryIcon(category: string = "") {
  const cat = category.toLowerCase();
  if (cat.includes("food") || cat.includes("dinner") || cat.includes("lunch") || cat.includes("restaurant") || cat.includes("meal")) {
    return <Utensils className="h-4 w-4 text-amber-500" />;
  }
  if (cat.includes("cafe") || cat.includes("coffee") || cat.includes("tea") || cat.includes("chai") || cat.includes("drink")) {
    return <Coffee className="h-4 w-4 text-amber-600" />;
  }
  if (cat.includes("travel") || cat.includes("cab") || cat.includes("taxi") || cat.includes("uber") || cat.includes("ola") || cat.includes("fuel")) {
    return <Car className="h-4 w-4 text-blue-500" />;
  }
  if (cat.includes("movie") || cat.includes("entertainment") || cat.includes("game")) {
    return <Film className="h-4 w-4 text-purple-500" />;
  }
  if (cat.includes("rent") || cat.includes("room") || cat.includes("maintenance") || cat.includes("home")) {
    return <Home className="h-4 w-4 text-indigo-500" />;
  }
  if (cat.includes("shop") || cat.includes("grocer") || cat.includes("mart")) {
    return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
  }
  if (cat.includes("bill") || cat.includes("utility") || cat.includes("wifi") || cat.includes("electricity")) {
    return <Zap className="h-4 w-4 text-yellow-500" />;
  }
  return <Receipt className="h-4 w-4 text-slate-500" />;
}

function formatDate(timestamp: any): string {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function SettlementBreakdownView({
  breakdown,
  currencySymbol = "₹",
  isCurrentUserCreditor = false,
  isCurrentUserDebtor = false,
  defaultOpen = false,
}: SettlementBreakdownViewProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const {
    contributingExpenses,
    contributingPayments,
    totalOwedForProducts,
    totalOffsetForProducts,
    totalPaymentsDeducted,
    settlementAmount,
    fromUserName,
    toUserName,
  } = breakdown;

  const hasContributingExpenses = contributingExpenses.length > 0;
  const hasPayments = contributingPayments.length > 0;

  // Debtor perspective vs Creditor perspective labels
  const debtorLabel = isCurrentUserDebtor ? "You" : fromUserName;
  const creditorLabel = isCurrentUserCreditor ? "You" : toUserName;

  return (
    <div className="w-full mt-3 pt-3 border-t border-slate-100">
      {/* Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-50 text-amber-900 border border-amber-200/70 shrink-0">
            <Receipt className="h-3 w-3 text-amber-600" />
            <span>
              {hasContributingExpenses 
                ? `${contributingExpenses.length} Contributing Product${contributingExpenses.length === 1 ? '' : 's'}`
                : "Product & Expense Breakdown"}
            </span>
          </span>

          {/* Quick preview pills when collapsed */}
          {!isOpen && hasContributingExpenses && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
              {contributingExpenses.slice(0, 3).map((e, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                  {e.description}
                </span>
              ))}
              {contributingExpenses.length > 3 && (
                <span className="text-slate-400 font-semibold text-[10px]">
                  +{contributingExpenses.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-slate-800 shrink-0">
          <span>{isOpen ? "Hide details" : "Why this amount?"}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expanded Breakdown Ledger */}
      {isOpen && (
        <div className="mt-2.5 space-y-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs animate-in fade-in-50 duration-200">
          
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1.5 border-b border-slate-200/60">
            <span>Product / Expense Details</span>
            <span>Impact on Balance</span>
          </div>

          {hasContributingExpenses ? (
            <div className="space-y-2.5">
              {contributingExpenses.map((expense) => {
                const dateStr = formatDate(expense.createdAt);
                const isOwed = expense.netEffect > 0;
                const isOffset = expense.netEffect < 0;

                return (
                  <div
                    key={expense.expenseId}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-[13px]">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-medium">
                              {expense.category}
                            </span>
                            {dateStr && (
                              <span className="inline-flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5" /> {dateStr}
                              </span>
                            )}
                            <span>• Total: {currencySymbol}{expense.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Net Effect Badge */}
                      <div className="text-right shrink-0">
                        {isOwed && (
                          <div className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-200 text-xs">
                            <Plus className="h-3 w-3" />
                            <span>{currencySymbol}{expense.netEffect.toFixed(2)}</span>
                          </div>
                        )}
                        {isOffset && (
                          <div className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 font-black border border-rose-200 text-xs">
                            <Minus className="h-3 w-3" />
                            <span>{currencySymbol}{Math.abs(expense.netEffect).toFixed(2)}</span>
                          </div>
                        )}
                        {!isOwed && !isOffset && (
                          <div className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
                            <span>{currencySymbol}0.00</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Explanatory subtitle */}
                    <div className="text-[11px] text-slate-600 pl-8 flex items-center justify-between gap-2 flex-wrap">
                      <span>
                        {expense.isCreditorPayer ? (
                          <>
                            <span className="font-semibold text-slate-800">{creditorLabel}</span> paid • {debtorLabel} owes share
                          </>
                        ) : expense.isDebtorPayer ? (
                          <>
                            <span className="font-semibold text-slate-800">{debtorLabel}</span> paid • {creditorLabel} owed share (offsets debt)
                          </>
                        ) : (
                          <>Shared group expense</>
                        )}
                      </span>

                      {/* Itemized tags if any */}
                      {expense.debtorItems && expense.debtorItems.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {expense.debtorItems.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200/60">
                              <Tag className="h-2.5 w-2.5 text-amber-600" />
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center space-y-1">
              <Info className="h-4 w-4 text-amber-600 mx-auto" />
              <p className="font-medium text-slate-700 text-xs">
                Simplified Group Balance
              </p>
              <p className="text-[11px] text-slate-500">
                This settlement is calculated by the debt simplification algorithm across group transactions to minimize transfers.
              </p>
            </div>
          )}

          {/* Approved Payments Section */}
          {hasPayments && (
            <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Approved Settlements Recorded
              </p>
              {contributingPayments.map((p) => (
                <div key={p.paymentId} className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-[11px]">
                  <span className="font-medium text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Direct Payment Settled
                  </span>
                  <span className="font-bold text-emerald-800">
                    -{currencySymbol}{p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Mathematical Summary Calculation Banner */}
          <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1 text-amber-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Net Calculation Summary</span>
              </span>
              <span className="text-sm font-black text-slate-950">
                {currencySymbol}{settlementAmount.toFixed(2)}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-0.5">
              {totalOwedForProducts > 0 && (
                <div className="flex justify-between">
                  <span>{debtorLabel}&apos;s share for products paid by {creditorLabel}:</span>
                  <span className="font-semibold text-emerald-700">+{currencySymbol}{totalOwedForProducts.toFixed(2)}</span>
                </div>
              )}
              {totalOffsetForProducts > 0 && (
                <div className="flex justify-between">
                  <span>Offset from products paid by {debtorLabel}:</span>
                  <span className="font-semibold text-rose-700">-{currencySymbol}{totalOffsetForProducts.toFixed(2)}</span>
                </div>
              )}
              {totalPaymentsDeducted > 0 && (
                <div className="flex justify-between">
                  <span>Previous payments deducted:</span>
                  <span className="font-semibold text-slate-700">-{currencySymbol}{totalPaymentsDeducted.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-amber-200/60 font-black text-slate-900 text-xs">
                <span>Final Exact Standing:</span>
                <span className="text-amber-900">{currencySymbol}{settlementAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
