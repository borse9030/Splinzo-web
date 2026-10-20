"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/useGroups";
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
  Edit3,
  Search,
  Target,
  Share2,
  ArrowRight,
  CreditCard,
  Smartphone,
  Banknote,
  Users,
  Check
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

export const PAYMENT_METHODS = [
  { name: "UPI", icon: Smartphone },
  { name: "Card", icon: CreditCard },
  { name: "Cash", icon: Banknote },
];

export const QUICK_PRESETS = [
  { label: "☕ Chai / Coffee", amount: 30, category: "Food" },
  { label: "🚕 Auto / Cab", amount: 120, category: "Travel" },
  { label: "🍔 Lunch / Meal", amount: 200, category: "Food" },
  { label: "🛒 Groceries", amount: 450, category: "Shopping" },
  { label: "⚡ Bill / Recharge", amount: 299, category: "Bills" },
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
  const router = useRouter();
  const { appUser } = useAuth();
  const { groups } = useGroups();
  
  const [expenses, setExpenses] = useState<PersonalExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Budget Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetValue, setBudgetValue] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  // Split to Group Modal state
  const [splitItem, setSplitItem] = useState<PersonalExpenseItem | null>(null);

  useEffect(() => {
    if (!appUser?.id) return;
    loadExpenses();
    loadBudget();
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

  const loadBudget = async () => {
    if (!appUser?.id) return;
    try {
      const b = await personalExpenseService.getMonthlyBudget(appUser.id);
      setMonthlyBudget(b);
      setBudgetValue(b > 0 ? String(b) : "");
    } catch (e) {
      console.error("Failed to load budget", e);
    }
  };

  const handleOpenAddModal = (preset?: { label: string; amount: number; category: string }) => {
    setEditingExpenseId(null);
    if (preset) {
      setAmount(String(preset.amount));
      setDescription(preset.label.replace(/^[^\s]+\s/, ""));
      setCategory(preset.category);
    } else {
      setAmount("");
      setDescription("");
      setCategory("Food");
    }
    setPaymentMethod("UPI");
    setNotes("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: PersonalExpenseItem) => {
    setEditingExpenseId(item.id);
    setAmount(String(item.amount));
    setDescription(item.description);
    setCategory(item.category || "Food");
    setPaymentMethod(item.paymentMethod || "UPI");
    setNotes(item.notes || "");
    const d = parseExpenseDate(item.date);
    setExpenseDate(d.toISOString().split("T")[0]);
    setShowModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.id || !amount || !description.trim()) return;
    try {
      setSubmitting(true);
      const parsedDate = expenseDate ? new Date(expenseDate + "T12:00:00") : new Date();
      const numAmount = parseFloat(amount);

      if (editingExpenseId) {
        await personalExpenseService.updatePersonalExpense(appUser.id, editingExpenseId, {
          description: description.trim(),
          amount: numAmount,
          category,
          date: parsedDate,
          notes: notes.trim() || undefined,
          paymentMethod,
        });
        setExpenses(prev =>
          prev.map(item =>
            item.id === editingExpenseId
              ? {
                  ...item,
                  description: description.trim(),
                  amount: numAmount,
                  category,
                  date: parsedDate,
                  notes: notes.trim() || undefined,
                  paymentMethod,
                }
              : item
          )
        );
      } else {
        const created = await personalExpenseService.addPersonalExpense(appUser.id, {
          description: description.trim(),
          amount: numAmount,
          category,
          date: parsedDate,
          notes: notes.trim() || undefined,
          paymentMethod,
        });
        setExpenses(prev => [created as any, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save expense", err);
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

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.id) return;
    try {
      setSavingBudget(true);
      const val = parseFloat(budgetValue) || 0;
      await personalExpenseService.setMonthlyBudget(appUser.id, val);
      setMonthlyBudget(val);
      setShowBudgetModal(false);
    } catch (err) {
      console.error("Failed to update budget", err);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleSplitToGroup = (groupId: string) => {
    if (!splitItem) return;
    const url = `/groups/${groupId}/expenses/new?amount=${splitItem.amount}&description=${encodeURIComponent(splitItem.description)}&category=${encodeURIComponent(splitItem.category || "General")}`;
    setSplitItem(null);
    router.push(url);
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

  // Daily average & days in month
  const daysInMonth = useMemo(() => {
    return new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
  }, [currentMonthDate]);

  const daysPassed = useMemo(() => {
    const isCurrent =
      currentMonthDate.getMonth() === new Date().getMonth() &&
      currentMonthDate.getFullYear() === new Date().getFullYear();
    return isCurrent ? Math.max(1, new Date().getDate()) : daysInMonth;
  }, [currentMonthDate, daysInMonth]);

  const dailyAverage = useMemo(() => {
    return totalThisMonth > 0 ? totalThisMonth / daysPassed : 0;
  }, [totalThisMonth, daysPassed]);

  // Safe daily spend remaining from budget
  const safeDailyRemaining = useMemo(() => {
    if (monthlyBudget <= 0) return 0;
    const isCurrent =
      currentMonthDate.getMonth() === new Date().getMonth() &&
      currentMonthDate.getFullYear() === new Date().getFullYear();
    if (!isCurrent) return 0;
    const remainingDays = Math.max(1, daysInMonth - daysPassed + 1);
    const remainingBudget = monthlyBudget - totalThisMonth;
    return remainingBudget > 0 ? remainingBudget / remainingDays : 0;
  }, [monthlyBudget, totalThisMonth, daysInMonth, daysPassed, currentMonthDate]);

  // Category breakdown
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

  // Filtered list by category and search query
  const filtered = useMemo(() => {
    let list = monthExpenses;
    if (selectedFilter !== "All") {
      list = list.filter(e => e.category?.toLowerCase() === selectedFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        e =>
          e.description?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [monthExpenses, selectedFilter, searchQuery]);

  // Group filtered expenses by date
  const groupedExpenses = useMemo(() => {
    const groupsMap: { [dateKey: string]: { label: string; date: Date; items: PersonalExpenseItem[]; total: number } } = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    filtered.forEach(item => {
      const d = parseExpenseDate(item.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

      let label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      if (d.toDateString() === today.toDateString()) {
        label = "Today";
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      }

      if (!groupsMap[key]) {
        groupsMap[key] = { label, date: d, items: [], total: 0 };
      }
      groupsMap[key].items.push(item);
      groupsMap[key].total += item.amount || 0;
    });

    return Object.values(groupsMap).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filtered]);

  const getCategoryMeta = (catName: string) => {
    return CATEGORIES.find(c => c.name.toLowerCase() === catName?.toLowerCase()) || CATEGORIES[5];
  };

  const monthLabel = currentMonthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth =
    currentMonthDate.getMonth() === new Date().getMonth() &&
    currentMonthDate.getFullYear() === new Date().getFullYear();

  const budgetProgress = monthlyBudget > 0 ? Math.min(100, (totalThisMonth / monthlyBudget) * 100) : 0;
  const isOverBudget = monthlyBudget > 0 && totalThisMonth > monthlyBudget;

  return (
    <div className="space-y-6">
      {/* ══ SIGNATURE HERO CARD (GOLDEN AMBER GRADIENT) ══ */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden text-gray-950 transition-all"
        style={{
          background: "linear-gradient(135deg, #FFB800 0%, #FFA000 100%)",
          boxShadow: "0 20px 40px rgba(255, 184, 0, 0.25), 0 4px 14px rgba(0,0,0,0.04)",
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

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleOpenAddModal()}
                className="h-12 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-white shrink-0 bg-gray-950 hover:bg-black shadow-lg shadow-black/20"
              >
                <Plus className="h-5 w-5 text-amber-400 stroke-[3]" />
                <span>Log Solo Expense</span>
              </button>
            </div>
          </div>

          {/* ══ MONTHLY BUDGET PROGRESS BAR ══ */}
          <div className="rounded-2xl p-3.5 bg-white/60 backdrop-blur-md border border-white/60 shadow-xs">
            <div className="flex items-center justify-between text-xs font-black mb-1.5 text-gray-900">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-gray-900" />
                <span>Monthly Budget</span>
                {monthlyBudget > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isOverBudget ? "bg-red-500 text-white" : "bg-black/10 text-gray-900"}`}>
                    {Math.round(budgetProgress)}% spent
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="text-[11px] font-extrabold hover:underline text-gray-900 flex items-center gap-1 bg-black/5 hover:bg-black/10 px-2 py-0.5 rounded-lg transition-colors"
              >
                {monthlyBudget > 0 ? "Edit Budget" : "+ Set Monthly Budget"}
              </button>
            </div>

            {monthlyBudget > 0 ? (
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-black/10 overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${isOverBudget ? "bg-red-600" : "bg-gray-950"}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-800">
                  <span>
                    Spent ₹{totalThisMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })} of ₹{monthlyBudget.toLocaleString("en-IN")}
                  </span>
                  {safeDailyRemaining > 0 && isCurrentMonth && (
                    <span className="text-emerald-900 font-extrabold">
                      ~₹{Math.round(safeDailyRemaining)}/day safe pace
                    </span>
                  )}
                  {isOverBudget && (
                    <span className="text-red-700 font-extrabold">
                      ₹{Math.round(totalThisMonth - monthlyBudget).toLocaleString("en-IN")} over budget
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] font-medium text-gray-800">
                Set a monthly budget to track spending pace, savings, and remaining daily allowance.
              </p>
            )}
          </div>

          {/* Frosted Glass Insight Cards */}
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

      {/* ══ QUICK-ADD PRESET CHIPS ══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider shrink-0 text-muted-foreground mr-1">
          Quick Log:
        </span>
        {QUICK_PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => handleOpenAddModal(preset)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1.5"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <span>{preset.label}</span>
            <span className="font-black text-amber-500">₹{preset.amount}</span>
          </button>
        ))}
      </div>

      {/* ══ SEARCH & CATEGORY FILTER ══ */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search expenses by name or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-9 rounded-2xl text-xs font-semibold outline-none border transition-all focus:ring-2 focus:ring-amber-400"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
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
      </div>

      {/* ══ EXPENSE LIST (DAY GROUPED) ══ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-18 rounded-2xl animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      ) : groupedExpenses.length === 0 ? (
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
            {searchQuery ? "No matching expenses found" : `No solo expenses in ${monthLabel}`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No entries match "${searchQuery}". Clear your search to see all entries.`
              : selectedFilter === "All"
              ? "Track personal coffee, rides, groceries or rent here without sharing with any group."
              : `No expenses logged under "${selectedFilter}" for this month.`}
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="mt-5 px-5 py-2.5 rounded-2xl text-xs font-extrabold text-gray-950 inline-flex items-center gap-1.5 transition-transform hover:scale-105"
            style={{ background: AMBER, boxShadow: "0 4px 16px rgba(255, 184, 0, 0.3)" }}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" /> Log First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedExpenses.map(group => (
            <div key={group.label} className="space-y-2">
              {/* Day Header with Subtotal */}
              <div className="flex items-center justify-between px-1 text-xs font-extrabold text-muted-foreground">
                <span>{group.label}</span>
                <span>₹{group.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Day Items */}
              <div className="space-y-2">
                {group.items.map(item => {
                  const meta = getCategoryMeta(item.category);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all hover:shadow-sm group"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{ background: meta.bg }}
                        >
                          <Icon className="h-5 w-5" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate" style={{ color: "var(--foreground)" }}>
                            {item.description}
                          </div>
                          <div className="text-xs font-semibold flex items-center gap-1.5 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                            <span>{item.category}</span>
                            {item.paymentMethod && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-bold">
                                  {item.paymentMethod}
                                </span>
                              </>
                            )}
                            {item.notes && (
                              <>
                                <span>•</span>
                                <span className="italic max-w-[120px] truncate">{item.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                          ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>

                        {/* Split to Group Action */}
                        <button
                          onClick={() => setSplitItem(item)}
                          className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                          title="Split with Group"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Split</span>
                        </button>

                        {/* Edit Action */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit Expense"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ ADD / EDIT SOLO EXPENSE MODAL ══ */}
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
                      {editingExpenseId ? "Edit Solo Expense" : "Log Solo Expense"}
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

              <form onSubmit={handleSaveExpense} className="space-y-4">
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

                {/* Date and Payment Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      className="w-full h-11 rounded-2xl text-xs font-bold px-3 outline-none border"
                      style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {PAYMENT_METHODS.map(pm => {
                        const isSel = paymentMethod === pm.name;
                        return (
                          <button
                            key={pm.name}
                            type="button"
                            onClick={() => setPaymentMethod(pm.name)}
                            className={`h-11 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all border ${isSel ? "bg-amber-400/20 border-amber-500 text-amber-600" : "bg-muted border-border text-muted-foreground"}`}
                          >
                            {pm.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                          className="py-2 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition-all border"
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
                    {submitting ? "Saving..." : editingExpenseId ? "Update Expense" : "Save Expense"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ SET MONTHLY BUDGET MODAL ══ */}
      <AnimatePresence>
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                    Monthly Solo Budget
                  </h3>
                </div>
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Set a monthly spending limit for personal expenses to stay on track.
              </p>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-amber-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="e.g. 15000"
                    value={budgetValue}
                    onChange={e => setBudgetValue(e.target.value)}
                    className="w-full h-12 rounded-2xl text-xl font-black pl-9 pr-4 outline-none border transition-all focus:ring-2 focus:ring-amber-400"
                    style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                <div className="flex gap-2">
                  {[10000, 20000, 30000].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setBudgetValue(String(sug))}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold border border-border bg-muted hover:bg-muted/80 text-foreground"
                    >
                      ₹{sug / 1000}k
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={savingBudget}
                  className="w-full h-11 rounded-2xl font-black text-xs text-gray-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`,
                  }}
                >
                  {savingBudget ? "Saving..." : "Save Budget Limit"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ SPLIT TO GROUP MODAL ══ */}
      <AnimatePresence>
        {splitItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                    Split Expense with Group
                  </h3>
                </div>
                <button
                  onClick={() => setSplitItem(null)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Expense Preview */}
              <div className="p-3.5 rounded-2xl mb-4 bg-muted/50 border border-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-black">{splitItem.description}</div>
                  <div className="text-xs text-muted-foreground">{splitItem.category}</div>
                </div>
                <div className="text-base font-black text-amber-500">
                  ₹{splitItem.amount.toFixed(2)}
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Select a group to split with:
              </p>

              {groups.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  You haven&apos;t joined any groups yet. Create or join a group first!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none pr-1">
                  {groups.map(grp => (
                    <button
                      key={grp.id}
                      onClick={() => handleSplitToGroup(grp.id)}
                      className="w-full p-3 rounded-2xl border border-border hover:border-amber-400 bg-card hover:bg-amber-400/5 transition-all flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-amber-400/20 text-amber-600 font-black flex items-center justify-center text-sm shrink-0">
                          {grp.name?.charAt(0).toUpperCase() || "G"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate">{grp.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{grp.members?.length || 0} members</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
