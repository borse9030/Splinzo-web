"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SharedLedger, SharedExpenseItem } from "@/types/sharedLedger";
import { hashPin, sharedLedgerService } from "@/services/sharedLedgerService";
import { SplinzoLogo } from "@/components/ui/SplinzoLogo";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Lock, 
  Unlock, 
  Calendar, 
  Tag, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Receipt, 
  Sparkles, 
  Search, 
  Download, 
  Printer, 
  Share2, 
  Check, 
  TrendingUp, 
  Clock, 
  Eye, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ChevronDown,
  User,
  ExternalLink,
  ArrowRight,
  Shield,
  Layers,
  Sparkle
} from "lucide-react";

const AMBER = "#FFB800";
const AMBER_DARK = "#FFA000";

const CATEGORY_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  Food: { icon: Utensils, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" },
  Travel: { icon: Car, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" },
  Shopping: { icon: ShoppingBag, color: "#EC4899", bg: "rgba(236, 72, 153, 0.12)" },
  Bills: { icon: Receipt, color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
  Fun: { icon: Sparkles, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" },
  General: { icon: Tag, color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" },
};

const MEMBER_COLORS = ["#F9B912", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function getAvatarColor(str: string): string {
  const hash = str.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function parseItemDate(date: any): Date {
  if (!date) return new Date();
  if (typeof date?.toDate === "function") return date.toDate();
  if (date instanceof Date) return date;
  if (typeof date?.seconds === "number") return new Date(date.seconds * 1000);
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDate(date: any): string {
  const d = parseItemDate(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export default function SharedLedgerPage({ params }: { params: Promise<{ shareId: string }> }) {
  const resolvedParams = use(params);
  const shareId = resolvedParams.shareId;

  const [ledger, setLedger] = useState<SharedLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PIN lock state
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [copied, setCopied] = useState(false);

  // Listen to Firestore real-time updates
  useEffect(() => {
    if (!shareId) return;

    // Check session storage for saved unlock state
    const savedUnlock = sessionStorage.getItem(`unlocked_${shareId}`);
    if (savedUnlock === "true") {
      setIsUnlocked(true);
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, "shared_ledgers", shareId),
      (docSnap) => {
        setLoading(false);
        if (!docSnap.exists()) {
          setError("This shared expense link does not exist or has been removed.");
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as SharedLedger;

        // Check if deactivated
        if (!data.isActive) {
          setError("This shared expense ledger has been deactivated by the owner.");
          return;
        }

        // Check if expired
        if (data.expiresAt) {
          const exp = parseItemDate(data.expiresAt);
          if (exp.getTime() < Date.now()) {
            setError("This shared expense link has expired.");
            return;
          }
        }

        setLedger(data);

        // Fallback: If ownerPhotoUrl is missing, attempt to fetch from user's profile
        if (data.userId && !data.ownerPhotoUrl) {
          getDoc(doc(db, "users", data.userId))
            .then((uSnap) => {
              if (uSnap.exists()) {
                const uData = uSnap.data();
                const photo = (uData?.photoUrl as string) || (uData?.photoURL as string);
                if (photo) {
                  setLedger((prev) => (prev ? { ...prev, ownerPhotoUrl: photo } : prev));
                }
              }
            })
            .catch(() => {});
        }

        // Record view once per session
        const viewedKey = `viewed_${shareId}`;
        if (!sessionStorage.getItem(viewedKey)) {
          sessionStorage.setItem(viewedKey, "1");
          sharedLedgerService.recordView(shareId);
        }
      },
      (err) => {
        console.error("Error reading shared ledger:", err);
        setLoading(false);
        setError("Unable to load this shared ledger. Please check your network connection.");
      }
    );

    return () => unsubscribe();
  }, [shareId]);

  // Handle PIN verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledger?.pinHash || !pinInput.trim()) return;

    setVerifyingPin(true);
    setPinError(false);
    try {
      const hashed = await hashPin(pinInput.trim());
      if (hashed === ledger.pinHash) {
        setIsUnlocked(true);
        sessionStorage.setItem(`unlocked_${shareId}`, "true");
      } else {
        setPinError(true);
        setPinInput("");
      }
    } catch {
      setPinError(true);
    } finally {
      setVerifyingPin(false);
    }
  };

  // Copy share URL
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!ledger || !ledger.items || ledger.items.length === 0) return;

    const headers = ["Date", "Description", "Category", "Payment Method", "Amount (INR)", "Notes"];
    const rows = ledger.items.map(item => [
      `"${formatDate(item.date)}"`,
      `"${(item.description || "").replace(/"/g, '""')}"`,
      `"${item.category || "General"}"`,
      `"${item.paymentMethod || "UPI"}"`,
      ledger.maskAmounts ? `"•••"` : item.amount,
      `"${(item.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Splinzo_Ledger_${(ledger.title || "Expenses").replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print ledger statement
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    if (!ledger?.items) return [];

    let list = [...ledger.items];

    // Category filter
    if (selectedCategory !== "All") {
      list = list.filter(item => item.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.description || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      const dateA = parseItemDate(a.date).getTime();
      const dateB = parseItemDate(b.date).getTime();
      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest") return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [ledger?.items, selectedCategory, searchQuery, sortBy]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    if (!ledger?.items || ledger.items.length === 0) {
      return { total: 0, count: 0, avg: 0, topCategory: "N/A", topCategoryShare: 0, catBreakdown: [] };
    }

    const total = ledger.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const count = ledger.items.length;
    const avg = count > 0 ? Math.round(total / count) : 0;

    // Category breakdown
    const catTotals: Record<string, number> = {};
    ledger.items.forEach(item => {
      const cat = item.category || "General";
      catTotals[cat] = (catTotals[cat] || 0) + (Number(item.amount) || 0);
    });

    const catBreakdown = Object.entries(catTotals).map(([cat, amt]) => ({
      name: cat,
      amount: amt,
      percent: total > 0 ? Math.round((amt / total) * 100) : 0,
      config: CATEGORY_MAP[cat] || CATEGORY_MAP.General,
    })).sort((a, b) => b.amount - a.amount);

    const topCategory = catBreakdown[0]?.name || "N/A";
    const topCategoryShare = catBreakdown[0]?.percent || 0;

    return { total, count, avg, topCategory, topCategoryShare, catBreakdown };
  }, [ledger?.items]);

  // Categories present in this ledger
  const availableCategories = useMemo(() => {
    if (!ledger?.items) return ["All"];
    const cats = Array.from(new Set(ledger.items.map(i => i.category || "General")));
    return ["All", ...cats];
  }, [ledger?.items]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-full border-3 border-transparent border-t-[#FFB800] border-r-[#FFB800] animate-spin flex items-center justify-center">
            <Wallet className="w-6 h-6 text-[#FFB800]" />
          </div>
        </div>
        <p className="mt-6 text-sm font-bold text-gray-600 dark:text-zinc-400 tracking-wide animate-pulse">
          Opening Splinzo Shared Ledger...
        </p>
      </div>
    );
  }

  // Error Screen
  if (error || !ledger) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-950 dark:text-white mb-2">Ledger Unavailable</h1>
        <p className="text-gray-600 dark:text-zinc-400 max-w-md text-sm mb-6 leading-relaxed">
          {error || "This shared expense link is invalid, private, or has expired."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FFB800] to-[#FFA000] text-gray-950 font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-amber-500/20"
        >
          Go to Splinzo Home
        </Link>
      </div>
    );
  }

  // PIN Protection Screen
  if (ledger.hasPin && !isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 p-8 shadow-2xl text-center"
        >
          {/* User Profile Avatar in PIN Lock */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            {ledger.ownerPhotoUrl ? (
              <img
                src={ledger.ownerPhotoUrl}
                alt={ledger.ownerName || "Owner"}
                className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-xl"
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl border-4 border-amber-400"
                style={{ background: getAvatarColor(ledger.ownerName || "User") }}
              >
                {(ledger.ownerName || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FFB800] text-gray-950 flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900">
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          <h2 className="text-xl font-black text-gray-950 dark:text-white mb-1">Passcode Protected</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
            <span className="text-gray-900 dark:text-zinc-200 font-bold">{ledger.ownerName}</span> protected this expense ledger with a 4-digit PIN.
          </p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ""));
                  setPinError(false);
                }}
                className={`w-full text-center tracking-[0.5em] font-mono text-3xl py-3.5 px-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border ${
                  pinError ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-zinc-800 focus:border-[#FFB800]"
                } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none transition-all shadow-inner`}
              />
              {pinError && (
                <p className="text-red-500 text-xs mt-2 font-bold">Incorrect PIN. Please try again.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyingPin || pinInput.length < 4}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFB800] to-[#FFA000] text-gray-950 font-black text-sm hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              {verifyingPin ? (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock Ledger
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-500 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-end verified sharing on Splinzo</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const periodLabel = ledger.filterScope === "month" && ledger.monthYear 
    ? new Date(ledger.monthYear + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "All Time";

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-zinc-100 antialiased selection:bg-[#FFB800] selection:text-black print:bg-white print:text-black">
      
      {/* ══ TOP NAVBAR (SPLINZO BRANDED) ══ */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#0B0F17]/85 backdrop-blur-xl border-b border-gray-200/70 dark:border-zinc-800/80 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <SplinzoLogo size={32} nameColor="currentColor" />
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              <Wallet className="w-3 h-3 text-[#FFB800]" />
              Pocket Ledger
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={handlePrint}
              title="Print or Save as PDF Statement"
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              title="Download CSV Spreadsheet"
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FFA000] text-gray-950 font-black text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Share Link"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ MAIN BODY ══ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ══ SIGNATURE HERO CARD (GOLDEN AMBER GRADIENT WITH USER AVATAR) ══ */}
        <section
          className="rounded-3xl p-6 sm:p-9 relative overflow-hidden text-gray-950 transition-all"
          style={{
            background: "linear-gradient(135deg, #FFB800 0%, #FFA000 100%)",
            boxShadow: "0 20px 45px rgba(255, 184, 0, 0.22), 0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* Glowing ambient accents */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-30 bg-white pointer-events-none" />
          <div className="absolute -bottom-20 right-1/4 w-64 h-64 rounded-full blur-2xl opacity-20 bg-white pointer-events-none" />
          
          {/* Watermark Wallet Motif */}
          <div className="absolute -right-6 -bottom-6 text-white/15 -rotate-12 pointer-events-none select-none">
            <Wallet className="h-52 w-52" />
          </div>

          <div className="relative z-10 space-y-6">
            
            {/* Top Bar: Profile Pic, Shared By & Status Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* User Profile Avatar & Info */}
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="relative shrink-0">
                  {ledger.ownerPhotoUrl ? (
                    <img
                      src={ledger.ownerPhotoUrl}
                      alt={ledger.ownerName || "User"}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-white shadow-lg shadow-black/15 ring-2 ring-black/10"
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-lg border-3 border-white ring-2 ring-black/10"
                      style={{ background: getAvatarColor(ledger.ownerName || "Splinzo User") }}
                    >
                      {(ledger.ownerName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Verified Badge Icon */}
                  <div 
                    title="Verified Splinzo Ledger"
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-900/75">
                      Solo Expense Ledger
                    </span>
                    {ledger.isLiveSync && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/15 border border-emerald-950/25 text-emerald-950 text-[10px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                        Live Synced
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight flex items-center gap-1.5">
                    <span>Shared by {ledger.ownerName || "Splinzo User"}</span>
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-900/80 font-semibold mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {periodLabel}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {ledger.viewCount || 1} views
                    </span>
                    {ledger.ownerEmail && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[150px] sm:max-w-none opacity-80">{ledger.ownerEmail}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions (Share Link) */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-2xl bg-white/90 hover:bg-white text-gray-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-black/10 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? "Link Copied!" : "Share This Ledger"}</span>
                </button>
              </div>

            </div>

            {/* Center: Title & Big Amount Display */}
            <div className="pt-2 border-t border-black/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-950 mb-1">
                  {ledger.title || "Pocket Ledger"}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-900/80">
                  Detailed expense statement & transactions for {periodLabel}
                </p>
              </div>

              <div className="bg-black/10 backdrop-blur-md border border-black/10 rounded-2xl p-4 sm:p-5 min-w-[200px] text-right sm:text-right">
                <p className="text-xs uppercase font-extrabold tracking-wider text-gray-900/80 mb-0.5">
                  Total Spending
                </p>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-950">
                  {ledger.maskAmounts ? "••••••" : formatCurrency(metrics.total)}
                </div>
                <p className="text-[11px] font-medium text-gray-900/75 mt-1 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {formatDate(ledger.updatedAt || new Date())}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ══ STATS SUMMARY GRID (SPLINZO THEMED WHITE CARDS) ══ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* Card 1: Total Entries */}
          <div className="bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Total Entries</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
              {metrics.count}
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mt-1">Logged solo expenses</p>
          </div>

          {/* Card 2: Average Spend */}
          <div className="bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Average Spend</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white truncate">
              {ledger.maskAmounts ? "••••" : formatCurrency(metrics.avg)}
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mt-1">Per recorded transaction</p>
          </div>

          {/* Card 3: Top Category */}
          <div className="bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Top Category</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white truncate">
              {metrics.topCategory}
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mt-1">
              {metrics.topCategoryShare}% of total spent
            </p>
          </div>

          {/* Card 4: Verified Sync Status */}
          <div className="bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Sync Status</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>Verified</span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mt-1">Splinzo Verified Public Ledger</p>
          </div>

        </section>

        {/* ══ CATEGORY BREAKDOWN ══ */}
        {metrics.catBreakdown.length > 0 && (
          <section className="bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#FFB800]" />
                Category Breakdown
              </h3>
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">
                {metrics.catBreakdown.length} active categories
              </span>
            </div>

            {/* Visual Multi-Color Progress Bar */}
            <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden flex mb-5 shadow-inner">
              {metrics.catBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  style={{ width: `${item.percent}%`, backgroundColor: item.config.color }}
                  title={`${item.name}: ${item.percent}% (${formatCurrency(item.amount)})`}
                  className="h-full transition-all hover:opacity-85"
                />
              ))}
            </div>

            {/* Category Chips / Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.catBreakdown.map((item, idx) => {
                const IconComponent = item.config.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-gray-50 dark:bg-zinc-900/70 border border-gray-100 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: item.config.bg, color: item.config.color }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">{item.name}</span>
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-950 dark:text-white">
                        {ledger.maskAmounts ? "••••" : formatCurrency(item.amount)}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-semibold">{item.percent}% share</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══ SEARCH & FILTER BAR ══ */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search expenses by description or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#FFB800] transition-colors shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#FFB800] text-gray-950 shadow-md shadow-amber-500/20"
                    : "bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-700 shadow-xs"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="appearance-none bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 rounded-2xl px-3.5 py-2.5 pr-8 text-xs font-bold focus:outline-none focus:border-[#FFB800] cursor-pointer shadow-xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          </div>

        </section>

        {/* ══ TRANSACTIONS LIST (SPLINZO THEMED) ══ */}
        <section className="bg-white dark:bg-[#151D2A] border border-gray-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-950 dark:text-white">Itemized Transactions</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 font-extrabold">
                {filteredItems.length}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium hidden sm:inline">
              Sorted by {sortBy.replace("_", " ")}
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-zinc-400">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">No expenses match your filters.</p>
              <button
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="mt-3 text-xs font-bold text-[#FFB800] hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {filteredItems.map((item) => {
                const catConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.General;
                const IconComponent = catConfig.icon;
                const payment = item.paymentMethod || "UPI";

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Left: Category Icon & Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: catConfig.bg, color: catConfig.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-black text-gray-950 dark:text-white truncate">
                            {item.description || "Solo Expense"}
                          </h4>
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: catConfig.bg, color: catConfig.color }}
                          >
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                          <span>{formatDate(item.date)}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-zinc-300 font-bold">
                            {payment === "UPI" && <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                            {payment === "Card" && <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            {payment === "Cash" && <Banknote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                            {payment}
                          </span>
                          {item.notes && !ledger.maskNotes && (
                            <>
                              <span>•</span>
                              <span className="truncate italic text-gray-500 dark:text-zinc-400 max-w-[200px] sm:max-w-xs">
                                "{item.notes}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-base sm:text-lg font-black text-gray-950 dark:text-white tracking-tight">
                        {ledger.maskAmounts ? "••••" : formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ VIRAL GROWTH & DOWNLOAD CTA (SPLINZO CARD) ══ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-white to-amber-500/10 dark:from-amber-500/10 dark:via-zinc-900 dark:to-zinc-950 border border-amber-400/40 dark:border-amber-500/20 p-8 sm:p-10 shadow-xl print:hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs font-black tracking-wide">
                <Sparkle className="w-3 h-3 text-[#FFB800]" />
                POWERED BY SPLINZO
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
                Split, Track & Manage Bills Stress-Free
              </h3>
              <p className="text-gray-600 dark:text-zinc-400 text-sm max-w-lg leading-relaxed">
                Create solo pocket ledgers, share live verified statements, split group trip expenses, and track flatmate bills — 100% Free, Zero Ads.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFB800] to-[#FFA000] text-gray-950 font-black text-sm text-center shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95 transition-transform"
              >
                Create Free Account
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white font-bold text-sm text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-gray-200/80 dark:border-zinc-800/80 py-8 text-center text-xs text-gray-500 dark:text-zinc-500 print:text-black">
        <p>© {new Date().getFullYear()} Splinzo. Smart financial tracking & bill sharing.</p>
      </footer>

    </div>
  );
}
