"use client";

import { useState } from "react";
import { Expense } from "@/types/expense";
import { 
  Sparkles, 
  Trophy, 
  Flame, 
  MapPin, 
  Receipt, 
  X, 
  Share2, 
  Check, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";

interface TripWrappedModalProps {
  trip: any;
  group: any;
  expenses: Expense[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TripWrappedModal({
  trip,
  group,
  expenses,
  isOpen,
  onClose,
}: TripWrappedModalProps) {
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trip) return null;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = group?.currency === "INR" ? "₹" : (group?.currency || "₹");

  // Top spender
  const payerMap: { [uid: string]: number } = {};
  for (const exp of expenses) {
    payerMap[exp.payerId] = (payerMap[exp.payerId] || 0) + exp.amount;
  }

  let topPayerId = "";
  let topPayerAmount = 0;
  for (const [uid, amt] of Object.entries(payerMap)) {
    if (amt > topPayerAmount) {
      topPayerAmount = amt;
      topPayerId = uid;
    }
  }

  const topPayerMember = group?.members?.find((m: any) => m.id === topPayerId);
  const topPayerName = topPayerMember?.name || topPayerMember?.displayName || "Everyone";

  // Category breakdown
  const categoryMap: { [cat: string]: number } = {};
  for (const exp of expenses) {
    const cat = exp.category || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
  }

  let topCategory = "General";
  let topCategoryAmount = 0;
  for (const [cat, amt] of Object.entries(categoryMap)) {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategory = cat;
    }
  }

  // Highest bill
  let highestExpense: Expense | null = null;
  for (const exp of expenses) {
    if (!highestExpense || exp.amount > highestExpense.amount) {
      highestExpense = exp;
    }
  }

  const shareText = `✨ *${trip.title.toUpperCase()} WRAPPED* ✨\n\n` +
    `📍 Destination: ${trip.destination}\n` +
    `💸 Total Spent: ${currency}${totalSpent.toLocaleString("en-IN")}\n` +
    `👑 Top Spender: ${topPayerName} (${currency}${topPayerAmount.toLocaleString("en-IN")})\n` +
    `🍕 Top Category: ${topCategory}\n` +
    `⚡ Biggest Bill: ${highestExpense?.description || "N/A"} (${currency}${highestExpense?.amount.toLocaleString("en-IN")})\n\n` +
    `Calculated with Splinzo ⚡`;

  const handleShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalSlides = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl border border-slate-800">
        
        {/* Story Progress Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden bg-white/20"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  i <= slide ? "bg-amber-400" : "bg-transparent"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-7 right-4 z-20 rounded-full p-2 text-white/70 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Slide 0: Intro */}
        {slide === 0 && (
          <div className="min-h-[440px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 mb-6">
              <Sparkles className="h-3.5 w-3.5" /> SPLINZO WRAPPED 2026
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              {trip.title}
            </h2>
            <p className="flex items-center gap-1 text-slate-300 font-semibold text-sm mb-8">
              <MapPin className="h-4 w-4 text-amber-400" /> {trip.destination}
            </p>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 text-xs text-slate-300 max-w-xs">
              Take a walk through the memories, the expenses, and see who was the bank of the squad!
            </div>
          </div>
        )}

        {/* Slide 1: Total Damage */}
        {slide === 1 && (
          <div className="min-h-[440px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-rose-950/80 via-slate-900 to-slate-950">
            <span className="text-xs font-extrabold text-rose-300 tracking-widest uppercase mb-4">
              The Total Damage
            </span>
            <div className="text-5xl font-black text-white tracking-tight mb-2">
              {currency}{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm text-slate-400 mb-8">
              across {expenses.length} shared receipts & bills
            </p>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2.5 border border-white/10 text-xs font-bold text-slate-200">
              <Receipt className="h-4 w-4 text-amber-400" />
              {group?.members?.length || 1} friends split the journey
            </div>
          </div>
        )}

        {/* Slide 2: High Roller Award */}
        {slide === 2 && (
          <div className="min-h-[440px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4 shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>
            <span className="text-xs font-extrabold text-amber-400 tracking-widest uppercase mb-2">
              The High Roller 👑
            </span>
            <div className="text-3xl font-extrabold text-white mb-2">
              {topPayerName}
            </div>
            <p className="text-sm text-amber-200/80 max-w-xs">
              Paid {currency}{topPayerAmount.toLocaleString("en-IN")} upfront for the squad!
            </p>
          </div>
        )}

        {/* Slide 3: Summary Recap & Share */}
        {slide === 3 && (
          <div className="min-h-[440px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="w-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 border border-amber-400/40 text-left shadow-xl mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-2 border-b border-white/10 mb-3">
                <span>SPLINZO RECAP</span>
                <span>{trip.destination}</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-3">{trip.title}</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Spent:</span>
                  <span className="font-bold text-white">{currency}{totalSpent.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Top Spender:</span>
                  <span className="font-bold text-white">{topPayerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Top Category:</span>
                  <span className="font-bold text-white">{topCategory}</span>
                </div>
                {highestExpense && (
                  <div className="flex justify-between text-slate-400">
                    <span>Highest Bill:</span>
                    <span className="font-bold text-white">{highestExpense.description}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleShare}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-300 transition"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" /> Share Trip Wrapped
                </>
              )}
            </button>
          </div>
        )}

        {/* Story Navigation Controls */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2 z-20">
          <button
            disabled={slide === 0}
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-[11px] font-bold text-slate-500">
            {slide + 1} of {totalSlides}
          </span>
          <button
            onClick={() => {
              if (slide < totalSlides - 1) {
                setSlide((s) => s + 1);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
          >
            {slide === totalSlides - 1 ? "Done" : "Next"} <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
