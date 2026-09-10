"use client";

import { useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { expenseService } from "@/services/expenseService";
import { storageService } from "@/services/storageService";
import { ChevronLeft, ArrowRight, Camera, X, Check, Users, Percent, PieChart, DollarSign, Repeat, Plus, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const AMBER      = "#F9B912";
const AMBER_DARK = "#F9A000";

/* ─── Avatar colour palette ─────────────────────────────── */
const AVATAR_COLORS = ["#E91E63","#9C27B0","#2196F3","#00BCD4","#4CAF50","#FF5722","#FF9800","#607D8B"];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ─── Member Avatar ──────────────────────────────────────── */
function MemberAvatar({ photoURL, name, id, size = 44 }: {
  photoURL?: string; name: string; id: string; size?: number;
}) {
  const [err, setErr] = useState(false);
  if (photoURL && !err) {
    return (
      <img src={photoURL} alt={name} onError={() => setErr(true)}
           className="rounded-full object-cover"
           style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-black shrink-0"
         style={{ width: size, height: size, background: avatarColor(id), fontSize: size * 0.38 }}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Step Progress Indicator ────────────────────────────── */
const STEP_LABELS = ["Amount", "Payer", "Split"];

function StepProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const done   = idx < step;
        const active = idx === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: done || active ? AMBER : "#E5E7EB",
                  scale: active ? 1.12 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
                style={{ boxShadow: active ? `0 0 0 4px rgba(249,185,18,0.2)` : "none" }}
              >
                {done ? (
                  <Check className="h-4 w-4 text-gray-900" />
                ) : (
                  <span className="text-xs font-black" style={{ color: active ? "#1a1a1a" : "#9CA3AF" }}>
                    {idx}
                  </span>
                )}
              </motion.div>
              <span className="text-[10px] font-bold"
                    style={{ color: active ? AMBER_DARK : done ? "#9CA3AF" : "#D1D5DB" }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-16 h-0.5 mx-1 mb-4 rounded-full transition-all duration-300"
                   style={{ background: done ? AMBER : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────── */
export default function AddExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const router         = useRouter();
  const { appUser }    = useAuth();
  const { group, loading: groupLoading } = useGroup(resolvedParams.groupId);

  const [step,           setStep]           = useState(1);
  const [amount,         setAmount]         = useState("");
  const [description,    setDescription]    = useState("");
  const [category,       setCategory]       = useState("General");
  const [payerId,        setPayerId]        = useState<string>(appUser?.id || "");
  const [isMultiPayer,   setIsMultiPayer]   = useState(false);
  const [payerAmounts,   setPayerAmounts]   = useState<{ [key: string]: number }>({});
  const [isRecurring,    setIsRecurring]    = useState(false);
  const [splitMode,      setSplitMode]      = useState<"equal" | "percentage" | "shares" | "custom">("equal");
  const [splitBetweenIds,setSplitBetweenIds]= useState<string[]>([]);
  const [customAmounts,  setCustomAmounts]  = useState<{ [key: string]: number }>({});
  const [percentages,    setPercentages]    = useState<{ [key: string]: number }>({});
  const [shares,         setShares]         = useState<{ [key: string]: number }>({});
  const [billImage,      setBillImage]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [amountFocused,  setAmountFocused]  = useState(false);
  const [descFocused,    setDescFocused]    = useState(false);

  /* Initialise split when group loads */
  if (group && splitBetweenIds.length === 0 && !groupLoading) {
    setSplitBetweenIds(group.members.map((m: any) => m.id));
    if (!payerId) setPayerId(appUser?.id || group.members[0]?.id);
  }

  const handleNext = () => {
    if (step === 1) {
      if (!amount || parseFloat(amount) <= 0) { setError("Please enter a valid amount."); return; }
      if (!description.trim())               { setError("Please enter a description."); return; }
      setError(""); setStep(2);
    } else if (step === 2) {
      if (isMultiPayer) {
        const numAmount = parseFloat(amount);
        const totalPaid = Object.values(payerAmounts).reduce((a, b) => a + b, 0);
        if (Math.abs(totalPaid - numAmount) > 0.05) {
          setError(`Total paid must equal ${currSymbol}${numAmount}. Currently: ${currSymbol}${totalPaid.toFixed(2)}`);
          return;
        }
      }
      setError(""); setStep(3);
    }
  };

  const handleCustomAmountChange = (memberId: string, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [memberId]: parseFloat(value) || 0 }));
  };

  const handlePercentageChange = (memberId: string, value: string) => {
    setPercentages(prev => ({ ...prev, [memberId]: parseFloat(value) || 0 }));
  };

  const handleShareChange = (memberId: string, delta: number) => {
    setShares(prev => {
      const current = prev[memberId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [memberId]: next };
    });
  };

  const handleAutoPercentages = () => {
    if (splitBetweenIds.length === 0) return;
    const equalPct = Number((100 / splitBetweenIds.length).toFixed(1));
    const next: { [key: string]: number } = {};
    splitBetweenIds.forEach(id => { next[id] = equalPct; });
    setPercentages(next);
  };

  const handleSave = async () => {
    if (!group || !appUser) return;
    const numAmount = parseFloat(amount);
    
    // Validation based on split mode
    let computedCustomAmounts: { [key: string]: number } | null = null;

    if (splitMode === "percentage") {
      const sumPct = splitBetweenIds.reduce((sum, id) => sum + (percentages[id] || 0), 0);
      if (Math.abs(sumPct - 100) > 0.5) {
        setError(`Percentages must add up to 100%. Currently: ${sumPct.toFixed(1)}%`);
        return;
      }
      computedCustomAmounts = {};
      splitBetweenIds.forEach(id => {
        computedCustomAmounts![id] = Number((numAmount * ((percentages[id] || 0) / 100)).toFixed(2));
      });
    } else if (splitMode === "shares") {
      let totalShares = 0;
      splitBetweenIds.forEach(id => { totalShares += (shares[id] || 1); });
      if (totalShares <= 0) totalShares = 1;
      computedCustomAmounts = {};
      splitBetweenIds.forEach(id => {
        const s = shares[id] || 1;
        computedCustomAmounts![id] = Number((numAmount * (s / totalShares)).toFixed(2));
      });
    } else if (splitMode === "custom") {
      const sum = Object.values(customAmounts).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - numAmount) > 0.05) {
        setError(`Custom amounts must equal ${group.currency} ${numAmount}. Currently: ${sum.toFixed(2)}`);
        return;
      }
      computedCustomAmounts = customAmounts;
    }

    setError("");

    // Optimistic UI: Route away instantly
    router.push(`/groups/${group.id}`);

    // Fire and forget backend updates
    Promise.resolve().then(async () => {
      try {
        let finalImageUrl = null;
        if (billImage) finalImageUrl = await storageService.uploadFile(billImage);
        await expenseService.addExpense(group.id, {
          description,
          amount: numAmount,
          payerId,
          currency: group.currency,
          createdBy: appUser.id,
          splitBetweenIds,
          customSplitAmounts: computedCustomAmounts,
          splitMode,
          splitPercentages: splitMode === "percentage" ? percentages : null,
          splitShares: splitMode === "shares" ? shares : null,
          payers: isMultiPayer ? payerAmounts : null,
          isRecurring,
          recurringInterval: isRecurring ? "monthly" : undefined,
          billImageUrl: finalImageUrl,
          category,
        });
      } catch (err: any) {
        console.error("Failed to add expense:", err.message || "Unknown error");
      }
    });
  };

  const currSymbol = group?.currency === "INR" ? "₹" : group?.currency || "₹";

  if (groupLoading) {
    return (
      <div className="max-w-xl mx-auto pt-6 px-4">
        <Skeleton className="h-[480px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-4 pb-10 px-4 sm:px-0"
         style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Back header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/groups/${resolvedParams.groupId}`}
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5">
          <ChevronLeft className="h-5 w-5" style={{ color: "var(--foreground)" }} />
        </Link>
        <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>Add Expense</h1>
      </div>

      {/* ── Card ── */}
      <div className="rounded-3xl overflow-hidden"
           style={{ background: "var(--card)", boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)" }}>

        {/* Amber progress bar */}
        <div className="h-1 w-full" style={{ background: "var(--muted)" }}>
          <motion.div
            className="h-1 rounded-r-full"
            style={{ background: `linear-gradient(90deg, ${AMBER}, ${AMBER_DARK})` }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="px-6 pt-8 pb-6">
          {/* Step progress */}
          <StepProgress step={step} />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mb-5 p-3 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2">
                <span className="text-red-500">⚠</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ STEP 1 ══ */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1"
                          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                          className="space-y-6">

                {/* Amount field */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Amount</span>
                  <div className="flex items-center justify-center gap-2"
                       style={{ borderBottom: `3px solid ${amountFocused ? AMBER : "var(--muted)"}`,
                                transition: "border-color 0.2s",
                                paddingBottom: "8px",
                                boxShadow: amountFocused ? `0 4px 0 -2px rgba(249,185,18,0.15)` : "none" }}>
                    <span className="text-4xl font-black" style={{ color: amountFocused ? AMBER : "var(--muted-foreground)" }}>
                      {currSymbol}
                    </span>
                    <input
                      type="number" step="0.01" placeholder="0.00"
                      value={amount} onChange={(e) => setAmount(e.target.value)}
                      onFocus={() => setAmountFocused(true)} onBlur={() => setAmountFocused(false)}
                      autoFocus
                      className="text-5xl font-black bg-transparent border-none outline-none w-44 text-center"
                      style={{ appearance: "textfield", color: "var(--foreground)" }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold" style={{ color: "var(--foreground)" }}>What was this for?</label>
                  <input
                    type="text" placeholder="e.g. Dinner at Goa"
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setDescFocused(true)} onBlur={() => setDescFocused(false)}
                    className="w-full h-12 px-4 rounded-2xl text-sm font-medium outline-none transition-all"
                    style={{
                      background: "var(--muted)",
                      border: `1.5px solid ${descFocused ? AMBER : "var(--border)"}`,
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {/* Recurring Expense switch */}
                <div className="p-3.5 rounded-2xl flex items-center justify-between border"
                     style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                         style={{ background: isRecurring ? AMBER : "var(--card)", color: isRecurring ? "#1a1a1a" : "var(--muted-foreground)" }}>
                      <Repeat className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Monthly Recurring</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Repeats every month automatically</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className="w-12 h-6 rounded-full transition-colors relative"
                    style={{ background: isRecurring ? AMBER : "#CBD5E1" }}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Category selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Category</label>
                  <div className="flex flex-wrap gap-2">
                    {["General", "Food", "Travel", "Stay", "Fun", "Bills", "Shopping"].map((cat) => {
                      const sel = category === cat;
                      return (
                        <button
                          key={cat} type="button"
                          onClick={() => setCategory(cat)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: sel ? AMBER : "var(--muted)",
                            color: sel ? "#1a1a1a" : "var(--muted-foreground)",
                            boxShadow: sel ? "0 2px 8px rgba(249,185,18,0.3)" : "none",
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bill Photo */}
                <div className="flex items-center gap-3">
                  <input
                    type="file" accept="image/*" ref={fileInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setBillImage(f);
                        setImagePreview(URL.createObjectURL(f));
                      }
                    }}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Receipt preview" className="h-14 w-14 rounded-xl object-cover border" />
                      <button
                        onClick={() => { setBillImage(null); setImagePreview(null); }}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-black/5"
                      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                    >
                      <Camera className="h-4 w-4" /> Add Bill Photo
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ STEP 2 ══ */}
            {step === 2 && (
              <motion.div key="step2"
                          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                          className="space-y-6">

                {/* Single vs Multi-Payer switch */}
                <div className="flex p-1 rounded-2xl" style={{ background: "var(--muted)" }}>
                  <button
                    type="button"
                    onClick={() => setIsMultiPayer(false)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
                    style={{
                      background: !isMultiPayer ? AMBER : "transparent",
                      color: !isMultiPayer ? "#1a1a1a" : "var(--muted-foreground)",
                      boxShadow: !isMultiPayer ? "0 2px 8px rgba(249,185,18,0.3)" : "none",
                    }}
                  >
                    Single Payer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiPayer(true);
                      if (Object.keys(payerAmounts).length === 0 && payerId) {
                        setPayerAmounts({ [payerId]: parseFloat(amount) || 0 });
                      }
                    }}
                    className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
                    style={{
                      background: isMultiPayer ? AMBER : "transparent",
                      color: isMultiPayer ? "#1a1a1a" : "var(--muted-foreground)",
                      boxShadow: isMultiPayer ? "0 2px 8px rgba(249,185,18,0.3)" : "none",
                    }}
                  >
                    Multiple People Paid
                  </button>
                </div>

                {!isMultiPayer ? (
                  <div>
                    <label className="text-sm font-bold block mb-3" style={{ color: "var(--foreground)" }}>
                      Who paid for this?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {group?.members.map((member: any) => {
                        const sel = payerId === member.id;
                        const mName = member.name || member.displayName || "?";
                        return (
                          <motion.div
                            key={member.id}
                            onClick={() => setPayerId(member.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="p-3.5 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all text-center"
                            style={{
                              background: sel ? "rgba(249,185,18,0.12)" : "var(--muted)",
                              border: `2px solid ${sel ? AMBER : "var(--border)"}`,
                            }}
                          >
                            <MemberAvatar 
                              photoURL={member.id === appUser?.id ? (appUser?.photoUrl || appUser?.photoURL || member.photoURL || member.photoUrl) : (member.photoURL || member.photoUrl)} 
                              name={mName} 
                              id={member.id} 
                              size={44} 
                            />
                            <div className="text-center">
                              <div className="text-sm font-bold truncate max-w-[80px]" style={{ color: "var(--foreground)" }}>
                                {mName.split(" ")[0]}
                              </div>
                              {member.id === appUser?.id && (
                                <div className="text-[10px] font-semibold mt-0.5" style={{ color: AMBER_DARK }}>You</div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-sm font-bold block" style={{ color: "var(--foreground)" }}>
                      Enter amount paid by each person
                    </label>
                    {group?.members.map((member: any) => {
                      const mName = member.name || member.displayName || "?";
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl border"
                             style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                          <div className="flex items-center gap-2.5">
                            <MemberAvatar name={mName} id={member.id} size={32} />
                            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{mName.split(" ")[0]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>{currSymbol}</span>
                            <input
                              type="number" step="0.01" placeholder="0.00"
                              value={payerAmounts[member.id] || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPayerAmounts(prev => ({ ...prev, [member.id]: val }));
                              }}
                              className="w-24 h-8 text-right rounded-xl text-sm font-bold outline-none px-2 border"
                              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ STEP 3 ══ */}
            {step === 3 && (
              <motion.div key="step3"
                          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                          className="space-y-5">

                {/* 4-Way Split Mode Segment */}
                <div className="grid grid-cols-4 p-1 rounded-2xl gap-1" style={{ background: "var(--muted)" }}>
                  {[
                    { id: "equal", label: "Equal", icon: Users },
                    { id: "percentage", label: "Percent %", icon: Percent },
                    { id: "shares", label: "Shares", icon: PieChart },
                    { id: "custom", label: "Exact", icon: DollarSign },
                  ].map((tab) => {
                    const sel = splitMode === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSplitMode(tab.id as any)}
                        className="py-2 px-1 flex flex-col items-center gap-1 rounded-xl text-[11px] font-bold transition-all"
                        style={{
                          background: sel ? AMBER : "transparent",
                          color: sel ? "#1a1a1a" : "var(--muted-foreground)",
                          boxShadow: sel ? "0 2px 8px rgba(249,185,18,0.3)" : "none",
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {splitMode === "percentage" && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>Assign % to each member</span>
                    <button
                      type="button"
                      onClick={handleAutoPercentages}
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: "rgba(249,185,18,0.15)", color: AMBER_DARK }}
                    >
                      Auto 100%
                    </button>
                  </div>
                )}

                {splitMode === "shares" && (
                  <div className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Assign shares (e.g. 2 for couples, nights stayed, or portions)
                  </div>
                )}

                {/* Member rows */}
                <div className="space-y-2">
                  {group?.members.map((member: any) => {
                    const mName      = (member.name || member.displayName || "?");
                    const isIncluded = splitBetweenIds.includes(member.id);
                    const numAmount  = parseFloat(amount) || 0;
                    const equalShare = numAmount / (splitBetweenIds.length || 1);

                    // Shares calculation
                    let totalShares = 0;
                    splitBetweenIds.forEach(id => { totalShares += (shares[id] || 1); });
                    if (totalShares <= 0) totalShares = 1;
                    const currentShare = shares[member.id] || 1;
                    const shareAmount = numAmount * (currentShare / totalShares);

                    return (
                      <div key={member.id}
                           className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                           style={{
                             background: isIncluded ? "rgba(249,185,18,0.05)" : "var(--muted)",
                             border: `1.5px solid ${isIncluded ? "rgba(249,185,18,0.25)" : "var(--border)"}`,
                           }}>

                        {/* Amber checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isIncluded) setSplitBetweenIds(prev => prev.filter(id => id !== member.id));
                            else setSplitBetweenIds(prev => [...prev, member.id]);
                          }}
                          className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: isIncluded ? AMBER : "var(--card)",
                            border: `2px solid ${isIncluded ? AMBER : "var(--border)"}`,
                          }}
                        >
                          {isIncluded && <Check className="h-3 w-3 text-gray-900" />}
                        </button>

                        {/* Avatar + name */}
                        <MemberAvatar 
                          photoURL={member.id === appUser?.id ? (appUser?.photoUrl || appUser?.photoURL || member.photoURL || member.photoUrl) : (member.photoURL || member.photoUrl)} 
                          name={mName} 
                          id={member.id} 
                          size={34} 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold truncate block" style={{ color: "var(--foreground)" }}>
                            {mName.split(" ")[0]}
                          </span>
                          {member.id === appUser?.id && (
                            <span className="text-[10px] font-bold" style={{ color: AMBER_DARK }}>You</span>
                          )}
                        </div>

                        {/* Input or Display according to split mode */}
                        {splitMode === "equal" && (
                          <span className="text-sm font-black"
                                style={{ color: isIncluded ? "var(--foreground)" : "var(--muted-foreground)" }}>
                            {isIncluded ? `${currSymbol}${equalShare.toFixed(2)}` : `${currSymbol}0.00`}
                          </span>
                        )}

                        {splitMode === "percentage" && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                              {currSymbol}{((numAmount * (percentages[member.id] || 0)) / 100).toFixed(2)}
                            </span>
                            <div className="flex items-center">
                              <input
                                type="number" placeholder="0"
                                disabled={!isIncluded}
                                value={percentages[member.id] || ""}
                                onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                                className="w-16 h-8 text-right rounded-xl text-sm font-bold outline-none px-2 border"
                                style={{
                                  background: isIncluded ? "var(--card)" : "var(--muted)",
                                  borderColor: isIncluded ? AMBER : "var(--border)",
                                  color: isIncluded ? "var(--foreground)" : "var(--muted-foreground)",
                                }}
                              />
                              <span className="ml-1 text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>%</span>
                            </div>
                          </div>
                        )}

                        {splitMode === "shares" && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                              {currSymbol}{shareAmount.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                              <button
                                type="button"
                                disabled={!isIncluded || currentShare <= 1}
                                onClick={() => handleShareChange(member.id, -1)}
                                className="h-6 w-6 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-black/10"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-black w-4 text-center">{currentShare}</span>
                              <button
                                type="button"
                                disabled={!isIncluded}
                                onClick={() => handleShareChange(member.id, 1)}
                                className="h-6 w-6 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-black/10"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {splitMode === "custom" && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>{currSymbol}</span>
                            <input
                              type="number" placeholder="0.00"
                              disabled={!isIncluded}
                              value={customAmounts[member.id] || ""}
                              onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                              className="w-20 h-8 text-right rounded-xl text-sm font-bold outline-none px-2 transition-all"
                              style={{
                                background: isIncluded ? "var(--card)" : "var(--muted)",
                                border: `1.5px solid ${isIncluded ? AMBER : "var(--border)"}`,
                                color: isIncluded ? "var(--foreground)" : "var(--muted-foreground)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer buttons ── */}
        <div className="flex justify-between items-center px-6 py-5"
             style={{ borderTop: "1px solid var(--border)", background: "var(--muted)" }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}
                    className="h-10 px-5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="h-10 px-6 rounded-xl text-sm font-bold flex items-center gap-2 relative overflow-hidden group"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, color: "#1a1a1a",
                       boxShadow: "0 4px 16px rgba(249,185,18,0.35)" }}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                   style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }} />
              Next <ArrowRight className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSave} disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="h-10 px-7 rounded-xl text-sm font-bold flex items-center gap-2 relative overflow-hidden group disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DARK})`, color: "#1a1a1a",
                       boxShadow: "0 4px 16px rgba(249,185,18,0.35)" }}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                   style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }} />
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-black/20 border-t-black/70 animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Save Expense</span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
