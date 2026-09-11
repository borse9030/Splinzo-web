"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { personalExpenseService, PersonalExpenseItem } from "@/services/personalExpenseService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Receipt, 
  Sparkles, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  TrendingUp, 
  PieChart, 
  X,
  AlertCircle
} from "lucide-react";

const AMBER = "#FFB800";
const AMBER_DARK = "#FFA000";

export const CATEGORIES = [
  { name: "Food", icon: Utensils, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  { name: "Travel", icon: Car, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" },
  { name: "Shopping", icon: ShoppingBag, color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)" },
  { name: "Bills", icon: Receipt, color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  { name: "Fun", icon: Sparkles, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" },
  { name: "General", icon: Tag, color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" },
];

function parseExpenseDate(date: any): Date {
  if (!date) return new Date();
  if (typeof date?.toDate === "function") {
    return date.toDate();
  }
  if (date instanceof Date) {
    return date;
  }
  if (typeof date?.seconds === "number") {
    return new Date(date.seconds * 1000);
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function PocketLedger() {
  const { appUser } = useAuth();
  const [expenses, setExpenses] = useState<PersonalExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!appUser?.id) return;
    loadExpenses();
  }, [appUser?.id]);

  const loadExpenses = async () => {
    if (!appUser?.id) return;
    try {
      setLoading(true);
      const items = await personalExpenseService.getPersonalExpenses(appUser.id);
      setExpenses(items);
    } catch (e) {
      console.error("Failed to load solo expenses", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.id || !amount || !description.trim()) return;
    try {
      setSubmitting(true);
      const parsedDate = expenseDate ? new Date(expenseDate + "T12:00:00") : new Date();
      const created = await personalExpenseService.addPersonalExpense(appUser.id, {
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date: parsedDate,
        notes: notes.trim() || undefined,
      });
      setExpenses(prev => [created as any, ...prev]);
      setShowModal(false);
      setAmount("");
      setDescription("");
      setNotes("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error("Failed to create expense", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!appUser?.id) return;
    try {
      await personalExpenseService.deletePersonalExpense(appUser.id, id);
      setExpenses(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const resetToCurrentMonth = () => {
    setCurrentMonthDate(new Date());
  };

  // Filter expenses by selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = parseExpenseDate(e.date);
      return (
        d.getMonth() === currentMonthDate.getMonth() &&
        d.getFullYear() === currentMonthDate.getFullYear()
      );
    });
  }, [expenses, currentMonthDate]);

  // Total for current month
  const totalThisMonth = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [monthExpenses]);

  // Daily average
  const dailyAverage = useMemo(() => {
    const isCurrent =
      currentMonthDate.getMonth() === new Date().getMonth() &&
      currentMonthDate.getFullYear() === new Date().getFullYear();
    const days = isCurrent
      ? Math.max(1, new Date().getDate())
      : new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    return totalThisMonth > 0 ? (totalThisMonth / days) : 0;
  }, [totalThisMonth, currentMonthDate]);

  // Category breakdown & Top category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => {
      const cat = e.category || "General";
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });

    const list = Object.entries(map).map(([name, sum]) => ({
      name,
      amount: sum,
      percentage: totalThisMonth > 0 ? (sum / totalThisMonth) * 100 : 0,
    }));
    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [monthExpenses, totalThisMonth]);

  const topCategory = categoryBreakdown[0] || null;

  // Filter by category chip
  const filtered = useMemo(() => {
    if (selectedFilter === "All") return monthExpenses;
    return monthExpenses.filter(e => e.category?.toLowerCase() === selectedFilter.toLowerCase());
  }, [monthExpenses, selectedFilter]);

  const getCategoryMeta = (catName: string) => {
    return CATEGORIES.find(c => c.name.toLowerCase() === catName?.toLowerCase()) || CATEGORIES[5];
  };

  const monthLabel = currentMonthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth =
    currentMonthDate.getMonth() === new Date().getMonth() &&
    currentMonthDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* ══ SIGNATURE HERO CARD (GOLDEN AMBER GRADIENT) ══ */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden text-gray-950 transition-all"
        style={{
          background: "linear-gradient(135deg, #FFB800 0%, #FFA000 100%)",
          boxShadow: "0 20px 40px rgba(255, 184, 0, 0.25), 0 4px 14px rgba(0,0,0,0.04)",
          minHeight: "220px",
        }}
      >
        {/* Glowing glassmorphism circular accents */}
        <div className="absolute top-[-30%] right-[-10%] w-64 h-64 rounded-full blur-2xl opacity-30 bg-white pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[25%] w-48 h-48 rounded-full blur-xl opacity-20 bg-white pointer-events-none" />
        
        {/* Subtle Watermark Wallet Motif */}
        <div className="absolute -right-6 -bottom-6 text-white/15 -rotate-12 pointer-events-none select-none">
          <Wallet className="h-44 w-44" />
        </div>

        <div className="relative z-10 space-y-5">
          {/* Top Bar: Month Navigator & Entry Count Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-black/10 backdrop-blur-md rounded-2xl p-1 px-2 border border-black/10">
              <button
                onClick={prevMonth}
                aria-label="Previous Month"
                className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-black/10 transition-colors text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
              <button
                onClick={resetToCurrentMonth}
                title="Click to reset to current month"
                className="flex items-center gap-1.5 px-2 text-xs font-black uppercase tracking-wider text-gray-900 hover:opacity-80 transition-opacity"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{monthLabel}</span>
              </button>
              <button
                onClick={nextMonth}
                aria-label="Next Month"
                className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-black/10 transition-colors text-gray-900"
              >
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isCurrentMonth && (
                <button
                  onClick={resetToCurrentMonth}
                  className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white/40 hover:bg-white/60 text-gray-950 transition-colors"
                >
                  Back to Today
                </button>
              )}
              <span className="text-xs font-black px-3 py-1 rounded-full bg-black/10 text-gray-950 backdrop-blur-sm">
                {monthExpenses.length} {monthExpenses.length === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>

          {/* Center Amount & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-900/80 mb-1 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Total Solo Spending
              </p>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-gray-950">
                ₹{totalThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-medium text-gray-900/75 mt-1">
                Recorded solo expenses for {monthLabel}
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="h-12 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-white shrink-0 bg-gray-950 hover:bg-black shadow-lg shadow-black/20"
            >
              <Plus className="h-5 w-5 text-amber-400 stroke-[3]" />
              <span>Log Solo Expense</span>
            </button>
          </div>

          {/* Frosted Glass Insight Cards (Mirroring Group Balances style) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl px-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-gray-800" />
                <p className="text-[11px] font-bold text-gray-800">Daily Average</p>
              </div>
              <p className="text-lg font-black text-gray-950">
                ₹{dailyAverage.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                <span className="text-xs font-bold text-gray-700">/day</span>
              </p>
            </div>

            <div className="rounded-2xl px-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <PieChart className="h-3.5 w-3.5 text-gray-800" />
                <p className="text-[11px] font-bold text-gray-800">Top Spend</p>
              </div>
              <p className="text-lg font-black text-gray-950 truncate">
                {topCategory ? `${topCategory.name} (${Math.round(topCategory.percentage)}%)` : "—"}
              </p>
            </div>

            <div className="hidden sm:block rounded-2xl px-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="h-3.5 w-3.5 text-gray-800" />
                <p className="text-[11px] font-bold text-gray-800">Categories</p>
              </div>
              <p className="text-lg font-black text-gray-950">
                {categoryBreakdown.length} active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ CATEGORY DISTRIBUTION BAR ══ */}
      {totalThisMonth > 0 && categoryBreakdown.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span style={{ color: "var(--foreground)" }}>Monthly Category Breakdown</span>
            <span style={{ color: "var(--muted-foreground)" }}>100% solo budget</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
            {categoryBreakdown.map(item => {
              const meta = getCategoryMeta(item.name);
              return (
                <div
                  key={item.name}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: meta.color,
                  }}
                  title={`${item.name}: ₹${item.amount.toFixed(2)} (${item.percentage.toFixed(1)}%)`}
                  className="h-full transition-all"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ══ CATEGORY FILTER CHIPS ══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFilter("All")}
          className="px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5"
          style={{
            background: selectedFilter === "All" ? AMBER : "var(--card)",
            color: selectedFilter === "All" ? "#111827" : "var(--muted-foreground)",
            border: selectedFilter === "All" ? `1.5px solid ${AMBER_DARK}` : "1px solid var(--border)",
            boxShadow: selectedFilter === "All" ? "0 4px 12px rgba(255, 184, 0, 0.3)" : "none",
          }}
        >
          All ({monthExpenses.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = monthExpenses.filter(e => e.category?.toLowerCase() === cat.name.toLowerCase()).length;
          const isSel = selectedFilter.toLowerCase() === cat.name.toLowerCase();
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedFilter(cat.name)}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              style={{
                background: isSel ? cat.bg : "var(--card)",
                color: isSel ? cat.color : "var(--muted-foreground)",
                border: isSel ? `1.5px solid ${cat.color}` : "1px solid var(--border)",
                boxShadow: isSel ? `0 2px 10px ${cat.color}30` : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* ══ EXPENSE LIST ══ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-18 rounded-2xl animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="h-16 w-16 mx-auto rounded-3xl flex items-center justify-center mb-3"
            style={{ background: "rgba(255, 184, 0, 0.15)", color: AMBER_DARK }}
          >
            <Receipt className="h-8 w-8" />
          </div>
          <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
            No solo expenses in {monthLabel}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {selectedFilter === "All"
              ? "Track personal coffee, rides, groceries or rent here without sharing with any group."
              : `No expenses logged under "${selectedFilter}" for this month.`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 px-5 py-2.5 rounded-2xl text-xs font-extrabold text-gray-950 inline-flex items-center gap-1.5 transition-transform hover:scale-105"
            style={{ background: AMBER, boxShadow: "0 4px 16px rgba(255, 184, 0, 0.3)" }}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" /> Log First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => {
            const meta = getCategoryMeta(item.category);
            const Icon = meta.icon;
            const dateObj = parseExpenseDate(item.date);
            const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-sm group"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: meta.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                      {item.description}
                    </div>
                    <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic max-w-[120px] truncate">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ADD SOLO EXPENSE MODAL ══ */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255, 184, 0, 0.15)", color: AMBER_DARK }}
                  >
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black" style={{ color: "var(--foreground)" }}>
                      Log Solo Expense
                    </h3>
                    <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                      Personal tracker — not shared with any group
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                {/* Amount input */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black" style={{ color: AMBER_DARK }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      autoFocus
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full h-14 rounded-2xl text-2xl font-black pl-9 pr-4 outline-none border transition-all focus:ring-2 focus:ring-amber-400"
                      style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Coffee, Uber Ride, Groceries"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-12 rounded-2xl text-sm font-semibold px-4 outline-none border transition-all focus:ring-2 focus:ring-amber-400"
                    style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full h-11 rounded-2xl text-xs font-bold px-4 outline-none border"
                    style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                {/* Category Selector Grid */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--muted-foreground)" }}>
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => {
                      const sel = category === cat.name;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className="py-2.5 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border"
                          style={{
                            background: sel ? cat.bg : "var(--muted)",
                            borderColor: sel ? cat.color : "var(--border)",
                            color: sel ? cat.color : "var(--muted-foreground)",
                            boxShadow: sel ? `0 2px 10px ${cat.color}30` : "none",
                          }}
                        >
                          <Icon className="h-4 w-4" style={{ color: sel ? cat.color : "inherit" }} />
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Add personal note..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full h-10 rounded-2xl text-xs font-medium px-4 outline-none border"
                    style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-13 rounded-2xl font-black text-sm text-gray-950 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`,
                      boxShadow: "0 4px 18px rgba(255, 184, 0, 0.4)",
                    }}
                  >
                    {submitting ? "Saving..." : "Save Expense"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
