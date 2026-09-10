"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { personalExpenseService, PersonalExpenseItem } from "@/services/personalExpenseService";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, Coffee, Car, ShoppingBag, Receipt, Sparkles, Tag, Check, X } from "lucide-react";

const AMBER = "#F9B912";
const AMBER_DARK = "#F9A000";

const CATEGORIES = [
  { name: "Food", icon: Coffee, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  { name: "Travel", icon: Car, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" },
  { name: "Shopping", icon: ShoppingBag, color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)" },
  { name: "Bills", icon: Receipt, color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  { name: "Fun", icon: Sparkles, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" },
  { name: "General", icon: Tag, color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" },
];

export function PocketLedger() {
  const { appUser } = useAuth();
  const [expenses, setExpenses] = useState<PersonalExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
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
      const created = await personalExpenseService.addPersonalExpense(appUser.id, {
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date(),
      });
      setExpenses(prev => [created as any, ...prev]);
      setShowModal(false);
      setAmount("");
      setDescription("");
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

  const totalThisMonth = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const filtered = selectedFilter === "All"
    ? expenses
    : expenses.filter(e => e.category?.toLowerCase() === selectedFilter.toLowerCase());

  const getCategoryMeta = (catName: string) => {
    return CATEGORIES.find(c => c.name.toLowerCase() === catName?.toLowerCase()) || CATEGORIES[5];
  };

  return (
    <div className="space-y-6">
      {/* Monthly Budget & Spending Banner */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white"
           style={{ background: "linear-gradient(135deg, #1E293B, #0F172A)", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight">
              ₹{totalThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-slate-400 mt-1.5 font-medium">
              Total solo spending recorded this month across {expenses.length} entries
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="h-12 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 text-gray-900 shrink-0"
            style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, boxShadow: "0 4px 20px rgba(249,185,18,0.4)" }}
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            Log Solo Expense
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedFilter("All")}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          style={{
            background: selectedFilter === "All" ? "var(--foreground)" : "var(--card)",
            color: selectedFilter === "All" ? "var(--background)" : "var(--muted-foreground)",
            border: "1px solid var(--border)",
          }}
        >
          All ({expenses.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = expenses.filter(e => e.category?.toLowerCase() === cat.name.toLowerCase()).length;
          const isSel = selectedFilter.toLowerCase() === cat.name.toLowerCase();
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedFilter(cat.name)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              style={{
                background: isSel ? "var(--foreground)" : "var(--card)",
                color: isSel ? "var(--background)" : "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: isSel ? "inherit" : cat.color }} />
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl p-10 text-center border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <Receipt className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>No solo expenses recorded</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Track your morning coffee, taxi rides, groceries or rent here without sharing with any group.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-gray-900 inline-flex items-center gap-1.5"
            style={{ background: AMBER }}
          >
            <Plus className="h-4 w-4" /> Add First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => {
            const meta = getCategoryMeta(item.category);
            const Icon = meta.icon;
            const formattedDate = item.date?.toDate ? item.date.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently";

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-sm"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                       style={{ background: meta.bg }}>
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                      {item.description}
                    </div>
                    <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      {item.category} • {formattedDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-base font-black" style={{ color: "var(--foreground)" }}>
                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black" style={{ color: "var(--foreground)" }}>Log Solo Expense</h3>
                <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number" step="0.01" required autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full h-14 rounded-2xl text-2xl font-black px-4 outline-none border"
                    style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Description
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Coffee at Blue Tokai, Fuel, Groceries"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-12 rounded-2xl text-sm font-medium px-4 outline-none border"
                    style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

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
                          key={cat.name} type="button"
                          onClick={() => setCategory(cat.name)}
                          className="py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border"
                          style={{
                            background: sel ? AMBER : "var(--muted)",
                            borderColor: sel ? AMBER : "var(--border)",
                            color: sel ? "#111827" : "var(--muted-foreground)",
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit" disabled={submitting}
                    className="w-full h-12 rounded-2xl font-bold text-sm text-gray-900 transition-all disabled:opacity-50"
                    style={{ background: AMBER, boxShadow: "0 4px 16px rgba(249,185,18,0.35)" }}
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
