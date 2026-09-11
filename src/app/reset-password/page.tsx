"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  Star
} from "lucide-react";

/* ─── CONSTANTS ─────────────────────────────────────────── */
const AMBER = "#F9B912";
const AMBER_DARK = "#F9A000";

/* ─── SKETCH ART ────────────────────────────────────────── */
function DarkSketchArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 900"
           fill="none" preserveAspectRatio="xMidYMid slice">
        <path d="M-50 200 Q 200 100 400 220 Q 600 340 850 180"
              stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.12" fill="none" strokeDasharray="10 6"/>
        <path d="M-50 500 Q 250 380 450 520 Q 650 660 850 480"
              stroke="#F9B912" strokeWidth="1" strokeOpacity="0.08" fill="none" strokeDasharray="14 8"/>
        <path d="M-50 750 Q 300 650 500 750 Q 650 830 850 700"
              stroke="#F9B912" strokeWidth="1" strokeOpacity="0.07" fill="none" strokeDasharray="8 6"/>
        <g stroke="#F9B912" strokeWidth="2" strokeOpacity="0.2">
          <line x1="60" y1="80" x2="80" y2="100"/><line x1="80" y1="80" x2="60" y2="100"/>
          <line x1="720" y1="200" x2="740" y2="220"/><line x1="740" y1="200" x2="720" y2="220"/>
          <line x1="40" y1="600" x2="60" y2="620"/><line x1="60" y1="600" x2="40" y2="620"/>
          <line x1="760" y1="700" x2="780" y2="720"/><line x1="780" y1="700" x2="760" y2="720"/>
        </g>
        <circle cx="100" cy="160" r="30" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.15"
                fill="none" strokeDasharray="6 4"/>
        <circle cx="700" cy="300" r="22" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.12"
                fill="none" strokeDasharray="5 4"/>
        <circle cx="50" cy="780" r="16" stroke="#F9B912" strokeWidth="1" strokeOpacity="0.12"
                fill="none"/>
        <circle cx="760" cy="600" r="28" stroke="#F9B912" strokeWidth="1" strokeOpacity="0.1"
                fill="none" strokeDasharray="7 5"/>
        <text x="680" y="120" fontSize="32" fill="#F9B912" fillOpacity="0.1" fontWeight="900">₹</text>
        <text x="30" y="420" fontSize="24" fill="#F9B912" fillOpacity="0.1" fontWeight="900">$</text>
      </svg>
    </div>
  );
}

/* ─── LEFT BRANDING PANEL ───────────────────────────────── */
function LeftPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full p-12 overflow-hidden"
         style={{ background: "linear-gradient(160deg, #111008 0%, #1C1600 50%, #0F0F0F 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]"
           style={{ backgroundImage: "linear-gradient(#F9B912 1px,transparent 1px),linear-gradient(90deg,#F9B912 1px,transparent 1px)",
                    backgroundSize: "44px 44px" }}/>
      <DarkSketchArt />

      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
           style={{ background: AMBER }}/>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl"
           style={{ background: AMBER }}/>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }} className="relative z-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Splinzo" width={40} height={40} className="rounded-xl" priority/>
          <span className="text-xl font-black text-white tracking-tight">Splinzo</span>
        </Link>
      </motion.div>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}>
          <h2 className="text-5xl font-black leading-[1.1] text-white mb-3">
            Secure your{" "}
            <span style={{ background: `linear-gradient(135deg,${AMBER},${AMBER_DARK})`,
                           WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                           backgroundClip: "text" }}>
              Splinzo account.
            </span>
          </h2>
          <p className="text-white/50 text-base font-medium max-w-xs leading-relaxed">
            Choose a strong, unique password to keep your shared expense groups and balances safe.
          </p>
        </motion.div>

        <div className="relative h-44 mt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            className="absolute top-4 left-2 rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl bg-amber-400/20 text-amber-300">
              🛡️
            </div>
            <div>
              <div className="text-xs font-bold text-white">Military Grade Protection</div>
              <div className="text-[11px] text-white/50">Encrypted token validation</div>
            </div>
            <div className="ml-2 text-xs font-black text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={14} /> Active
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="relative z-10 flex items-center gap-4">
        <div className="flex -space-x-2">
          {["P","R","A","N","K"].map((l, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold text-black"
                 style={{ background: ["#FFE082","#FFD54F","#FFCA28","#FFC107","#FFB300"][i] }}>
              {l}
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#F9B912"/>)}
            <span className="text-xs font-bold text-white ml-1">4.9/5</span>
          </div>
          <p className="text-[11px] text-white/40 font-medium">Trusted by thousands of groups across India</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── RESET PASSWORD FORM ───────────────────────────────── */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";

  const [verifying, setVerifying] = useState(true);
  const [accountEmail, setAccountEmail] = useState("");
  const [invalidCode, setInvalidCode] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Focus states
  const [focusedPass, setFocusedPass] = useState(false);
  const [focusedConfirm, setFocusedConfirm] = useState(false);

  // Verify the reset code when component mounts
  useEffect(() => {
    let isMounted = true;

    async function verifyCode() {
      if (!oobCode) {
        if (isMounted) {
          setVerifying(false);
          setInvalidCode(true);
        }
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        if (isMounted) {
          setAccountEmail(userEmail);
          setVerifying(false);
        }
      } catch (err) {
        console.error("verifyPasswordResetCode error:", err);
        if (isMounted) {
          setVerifying(false);
          setInvalidCode(true);
        }
      }
    }

    verifyCode();

    return () => {
      isMounted = false;
    };
  }, [oobCode]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      triggerShake();
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/expired-action-code") {
        setError("This reset link has expired. Please request a new one.");
      } else if (code === "auth/invalid-action-code") {
        setError("This reset link is invalid or has already been used.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        const message = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
        setError(message);
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="w-full max-w-[420px] relative z-10">
      {/* Mobile Logo Header */}
      <div className="lg:hidden mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Splinzo" width={36} height={36} className="rounded-xl shadow-sm" priority />
          <span className="text-xl font-black text-gray-900">Splinzo</span>
        </Link>
      </div>

      {verifying ? (
        /* ─── VERIFYING TOKEN STATE ─── */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full border-3 border-amber-400 border-t-transparent animate-spin mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Verifying reset link…</h3>
          <p className="text-gray-400 text-xs">Securing your session with Firebase</p>
        </div>
      ) : invalidCode ? (
        /* ─── INVALID OR EXPIRED CODE STATE ─── */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-6 text-red-500 shadow-sm">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed">
            This password reset link is invalid, expired, or has already been used. Please request a fresh reset link to continue.
          </p>

          <Link
            href="/forgot-password"
            className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-black transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 mb-3"
            style={{
              background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`,
            }}
          >
            <RotateCcw size={16} />
            Request New Reset Link
          </Link>

          <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
            Back to Sign in
          </Link>
        </motion.div>
      ) : isSuccess ? (
        /* ─── SUCCESS STATE ─── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-18 h-18 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              boxShadow: "0 8px 30px rgba(16,185,129,0.35)",
            }}
          >
            <CheckCircle2 size={38} className="text-white" />
          </motion.div>

          <h2 className="text-3xl font-black text-gray-900 mb-2">Password Reset Done!</h2>
          <p className="text-gray-500 text-sm font-medium mb-7 max-w-sm">
            Your password has been successfully updated. You can now log into your Splinzo account with your new credentials.
          </p>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-black transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            style={{
              height: 52,
              background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`,
              boxShadow: "0 4px 20px rgba(249,185,18,0.3)",
            }}
          >
            Sign in to Splinzo
            <ArrowRight size={17} />
          </button>
        </motion.div>
      ) : (
        /* ─── NEW PASSWORD FORM ─── */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div {...fadeUp(0.1)} className="mb-7">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm"
                 style={{ background: "#FFF8E1", border: `1.5px solid ${AMBER}` }}>
              🔒
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-1.5 tracking-tight">Set new password</h1>
            <p className="text-gray-500 text-sm font-medium">
              Create a new secure password for{" "}
              <span className="font-bold text-gray-800">{accountEmail}</span>
            </p>
          </motion.div>

          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            {/* New Password */}
            <motion.div
              {...fadeUp(0.15)}
              animate={shake && !!error ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-1.5"
            >
              <label htmlFor="new-password" className="text-sm font-semibold text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedPass(true)}
                  onBlur={() => setFocusedPass(false)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 pr-12 py-3.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all duration-200"
                  style={{
                    height: 52,
                    background: focusedPass ? "#FFFFFF" : "#F8F8F8",
                    border: `2px solid ${error ? "#EF4444" : focusedPass ? AMBER : "#EBEBEB"}`,
                    boxShadow: focusedPass
                      ? `0 0 0 4px ${error ? "rgba(239,68,68,0.1)" : "rgba(249,185,18,0.15)"}`
                      : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              {...fadeUp(0.2)}
              animate={shake && !!error ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-1.5"
            >
              <label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedConfirm(true)}
                  onBlur={() => setFocusedConfirm(false)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 pr-12 py-3.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all duration-200"
                  style={{
                    height: 52,
                    background: focusedConfirm ? "#FFFFFF" : "#F8F8F8",
                    border: `2px solid ${error ? "#EF4444" : focusedConfirm ? AMBER : "#EBEBEB"}`,
                    boxShadow: focusedConfirm
                      ? `0 0 0 4px ${error ? "rgba(239,68,68,0.1)" : "rgba(249,185,18,0.15)"}`
                      : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Password strength guide */}
            <div className="text-xs text-gray-400 px-1">
              Must be at least 6 characters. Use letters, numbers, and symbols for better security.
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-2xl border border-red-100"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div {...fadeUp(0.25)}>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 rounded-2xl font-bold text-base transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 relative overflow-hidden group shadow-md"
                style={{
                  height: 52,
                  background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`,
                  color: "#1a1a1a",
                  boxShadow: "0 4px 24px rgba(249,185,18,0.35)",
                }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                     style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }} />

                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70 animate-spin" />
                    Updating password…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Update Password
                    <ArrowRight size={17} />
                  </span>
                )}
              </button>
            </motion.div>
          </form>

          <motion.p {...fadeUp(0.3)} className="text-center text-sm text-gray-400 font-medium mt-6">
            Remember your credentials?{" "}
            <Link href="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: AMBER }}>
              Log in
            </Link>
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

/* ─── EXPORTED COMPONENT ────────────────────────────────── */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ── LEFT PANEL ── */}
      <div className="lg:w-[55%] lg:min-h-screen">
        <LeftPanel />
      </div>

      {/* ── RIGHT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FAFAFA 0%, #FFFFFF 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
             style={{ background: AMBER }} />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none"
             style={{ background: AMBER }} />

        <Suspense fallback={<div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
