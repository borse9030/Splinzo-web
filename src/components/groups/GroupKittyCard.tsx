"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { KittyContribution, KittySummary } from "@/types/kitty";
import { useExpenses } from "@/hooks/useExpenses";
import { PiggyBank, Plus, Sparkles, X } from "lucide-react";

interface GroupKittyCardProps {
  groupId: string;
  currency: string;
}

export default function GroupKittyCard({ groupId, currency }: GroupKittyCardProps) {
  const { appUser } = useAuth();
  const { expenses } = useExpenses(groupId);

  const [contributions, setContributions] = useState<KittyContribution[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "groups", groupId, "kitty_contributions"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: KittyContribution[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          groupId: data.groupId || groupId,
          memberId: data.memberId || "",
          memberName: data.memberName || "Member",
          memberPhotoUrl: data.memberPhotoUrl,
          amount: Number(data.amount) || 0,
          note: data.note,
          createdAt: data.createdAt,
        });
      });
      setContributions(items);
    });

    return () => unsubscribe();
  }, [groupId]);

  const totalPooled = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalSpent = expenses
    .filter((e) => e.isPaidFromKitty === true)
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = Math.max(0, totalPooled - totalSpent);
  const remainingPercent = totalPooled > 0 ? Math.min(1, balance / totalPooled) : 1;
  const uniqueContributors = new Set(contributions.map((c) => c.memberId)).size;

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!appUser) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "groups", groupId, "kitty_contributions"), {
        groupId,
        memberId: appUser.id,
        memberName: appUser.name || appUser.displayName || "Member",
        memberPhotoUrl: appUser.photoUrl || appUser.photoURL || null,
        amount: numAmount,
        note: note.trim() || null,
        createdAt: serverTimestamp(),
      });

      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        kittyTotalPooled: increment(numAmount),
        kittyBalance: increment(numAmount),
        updatedAt: serverTimestamp(),
      });

      setAmount("");
      setNote("");
      setIsTopUpOpen(false);
    } catch (err) {
      console.error("Failed to add kitty contribution:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-xl border border-slate-700/50 mb-6">
        {/* Decorative ambient glow */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <PiggyBank className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">Group Kitty Pool</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    <Sparkles className="h-3 w-3" /> Shared Pot
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {totalPooled > 0
                    ? `${uniqueContributors} members pre-funded common expenses`
                    : "Zero micro-splitting on trips & room expenses"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTopUpOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-300 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Top Up
            </button>
          </div>

          {/* Balance display */}
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{currency}</span>
            <span className="text-4xl font-extrabold tracking-tight">
              {balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-medium">available in pot</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                remainingPercent > 0.3 ? "bg-amber-400" : "bg-red-500"
              }`}
              style={{ width: `${Math.max(5, remainingPercent * 100)}%` }}
            />
          </div>

          {/* Breakdown stats */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              Total Pooled: {currency}
              {totalPooled.toLocaleString("en-IN")}
            </span>
            <span>
              Spent from Pot: {currency}
              {totalSpent.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Recent contributors */}
          {contributions.length > 0 && (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-3">
              <span className="text-[11px] text-slate-400 font-semibold">Recent:</span>
              <div className="flex flex-wrap gap-1.5 overflow-hidden">
                {contributions.slice(0, 4).map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700/50"
                  >
                    <span>{c.memberName}</span>
                    <span className="text-amber-400 font-semibold">+{currency}{c.amount}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">Add to Group Kitty</h4>
                  <p className="text-xs text-slate-500">Contribute funds into the shared pot</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTopUp} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Amount ({currency})</label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-500">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-2xl font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Quick chip buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const current = parseFloat(amount) || 0;
                      setAmount((current + amt).toString());
                    }}
                    className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-amber-100 hover:text-amber-800 transition"
                  >
                    +{currency}{amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Fuel pool, Grocery share..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-amber-400 py-3.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-300 disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : `Confirm Contribution`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
