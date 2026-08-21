"use client";

import { useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { expenseService } from "@/services/expenseService";
import { storageService } from "@/services/storageService";
import { ChevronLeft, ArrowRight, Camera, X, Check } from "lucide-react";
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
    <div className="rounded-full flex items-center justify-center text-white font-black"
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
  const [splitType,      setSplitType]      = useState<"equal" | "custom">("equal");
  const [splitBetweenIds,setSplitBetweenIds]= useState<string[]>([]);
  const [customAmounts,  setCustomAmounts]  = useState<{ [key: string]: number }>({});
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
      setStep(3);
    }
  };

  const handleCustomAmountChange = (memberId: string, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [memberId]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    if (!group || !appUser) return;
    const numAmount = parseFloat(amount);
    if (splitType === "custom") {
      const sum = Object.values(customAmounts).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - numAmount) > 0.01) {
        setError(`Custom amounts must equal ${group.currency}${numAmount}. Currently: ${sum.toFixed(2)}`);
        return;
      }
    }
    setLoading(true); setError("");
    
    // Trigger Monetag Direct Link Ad synchronously to avoid popup blockers
    window.open("https://omg10.com/4/11624199", "_blank");

    try {
      let finalImageUrl = null;
      if (billImage) finalImageUrl = await storageService.uploadFile(billImage);
      await expenseService.addExpense(group.id, {
        description, amount: numAmount, payerId, currency: group.currency,
        createdBy: appUser.id, splitBetweenIds,
        customSplitAmounts: splitType === "custom" ? customAmounts : null,
        billImageUrl: finalImageUrl, category,
      });
      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
      setLoading(false);
    }
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
                      background: descFocused ? "var(--background)" : "var(--muted)",
                      color: "var(--foreground)",
                      border: `2px solid ${descFocused ? AMBER : "var(--border)"}`,
                      boxShadow: descFocused ? `0 0 0 4px rgba(249,185,18,0.12)` : "none",
                    }}
                  />
                </div>

                {/* Bill image upload */}
                <div
                  className="rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.01]"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${imagePreview ? AMBER : "var(--border)"}`,
                    background: imagePreview ? "rgba(249,185,18,0.04)" : "var(--muted)",
                    minHeight: "100px",
                  }}
                >
                  {imagePreview ? (
                    <div className="relative flex flex-col items-center w-full">
                      <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-xl mb-2" />
                      <span className="text-xs font-semibold bg-white text-gray-900 px-3 py-1 rounded-full shadow-sm border">
                        Tap to change
                      </span>
                      <button
                        className="absolute top-0 right-0 h-7 w-7 rounded-full flex items-center justify-center shadow-md"
                        style={{ background: "#1a1a1a" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBillImage(null); setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
                           style={{ background: "rgba(249,185,18,0.12)" }}>
                        <Camera className="h-5 w-5" style={{ color: AMBER }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>Add Bill Image</span>
                      <span className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Optional · tap to upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef}
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) { setBillImage(file); setImagePreview(URL.createObjectURL(file)); }
                         }} />
                </div>
              </motion.div>
            )}

            {/* ══ STEP 2 ══ */}
            {step === 2 && (
              <motion.div key="step2"
                          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                          className="space-y-4">
                <p className="text-sm font-bold text-center mb-6" style={{ color: "var(--muted-foreground)" }}>Who paid for this?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group?.members.map((member: any) => {
                    const isSelected = payerId === member.id;
                    const mName = (member.name || member.displayName || "?");
                    return (
                      <motion.div
                        key={member.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setPayerId(member.id)}
                        className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl cursor-pointer transition-all"
                        style={{
                          border: `2px solid ${isSelected ? AMBER : "var(--border)"}`,
                          background: isSelected ? "rgba(249,185,18,0.06)" : "var(--card)",
                          boxShadow: isSelected ? `0 4px 16px rgba(249,185,18,0.2)` : "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                               style={{ background: AMBER }}>
                            <Check className="h-3 w-3 text-gray-900" />
                          </div>
                        )}
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
              </motion.div>
            )}

            {/* ══ STEP 3 ══ */}
            {step === 3 && (
              <motion.div key="step3"
                          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                          className="space-y-5">

                {/* Split type toggle */}
                <div className="flex p-1 rounded-2xl" style={{ background: "var(--muted)" }}>
                  {(["equal", "custom"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSplitType(t)}
                      className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                      style={{
                        background: splitType === t ? AMBER : "transparent",
                        color: splitType === t ? "#1a1a1a" : "var(--muted-foreground)",
                        boxShadow: splitType === t ? "0 2px 8px rgba(249,185,18,0.3)" : "none",
                      }}
                    >
                      {t === "equal" ? "Split Equally" : "Custom Amounts"}
                    </button>
                  ))}
                </div>

                {/* Member rows */}
                <div className="space-y-2">
                  {group?.members.map((member: any) => {
                    const mName      = (member.name || member.displayName || "?");
                    const isIncluded = splitBetweenIds.includes(member.id);
                    const equalShare = parseFloat(amount) / (splitBetweenIds.length || 1);

                    return (
                      <div key={member.id}
                           className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                           style={{
                             background: isIncluded ? "rgba(249,185,18,0.05)" : "var(--muted)",
                             border: `1.5px solid ${isIncluded ? "rgba(249,185,18,0.25)" : "var(--border)"}`,
                           }}>

                        {/* Amber checkbox */}
                        <button
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

                        {/* Amount */}
                        {splitType === "equal" ? (
                          <span className="text-sm font-black"
                                style={{ color: isIncluded ? "var(--foreground)" : "var(--muted-foreground)" }}>
                            {isIncluded ? `${currSymbol}${equalShare.toFixed(2)}` : `${currSymbol}0.00`}
                          </span>
                        ) : (
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
