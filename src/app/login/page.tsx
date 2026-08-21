"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { userService } from "@/services/userService";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Star, ArrowRight } from "lucide-react";

/* ─── CONSTANTS ─────────────────────────────────────────── */
const AMBER = "#F9B912";
const AMBER_DARK = "#F9A000";

/* ─── GOOGLE SVG ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 488 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
  </svg>
);

/* ─── FLOATING EXPENSE CARDS ─────────────────────────────── */
const EXPENSE_CARDS = [
  {
    emoji: "🍕", title: "Dinner Split", sub: "3 people", amount: "₹1,800",
    color: "#FFF8E1", amountColor: AMBER,
  },
  {
    emoji: "✅", title: "Arjun settled up!", sub: "Paid his share", amount: "₹940",
    color: "#E8F5E9", amountColor: "#43A047",
  },
  {
    emoji: "🏖️", title: "Goa Trip", sub: "5 members", amount: "₹24,500",
    color: "#E3F2FD", amountColor: "#1E88E5",
  },
];

function FloatingCard({ card, delay, x, rotate }: {
  card: typeof EXPENSE_CARDS[0]; delay: number; x: number; rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: [0, 1, 1, 1],
        y: [40, 0, -12, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 4, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
      }}
      style={{ x: `${x}%`, rotate }}
      className="absolute glass-card-dark rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
    >
      <div className="text-2xl">{card.emoji}</div>
      <div>
        <div className="text-xs font-bold text-white">{card.title}</div>
        <div className="text-[10px] text-white/50">{card.sub}</div>
      </div>
      <div className="ml-2 text-sm font-black" style={{ color: card.amountColor }}>{card.amount}</div>
    </motion.div>
  );
}

/* ─── SKETCH ART (DARK VERSION) ─────────────────────────── */
function DarkSketchArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 900"
           fill="none" preserveAspectRatio="xMidYMid slice">
        {/* Wavy guide lines */}
        <path d="M-50 200 Q 200 100 400 220 Q 600 340 850 180"
              stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.12" fill="none" strokeDasharray="10 6"/>
        <path d="M-50 500 Q 250 380 450 520 Q 650 660 850 480"
              stroke="#F9B912" strokeWidth="1" strokeOpacity="0.08" fill="none" strokeDasharray="14 8"/>
        <path d="M-50 750 Q 300 650 500 750 Q 650 830 850 700"
              stroke="#F9B912" strokeWidth="1" strokeOpacity="0.07" fill="none" strokeDasharray="8 6"/>
        {/* Cross marks */}
        <g stroke="#F9B912" strokeWidth="2" strokeOpacity="0.2">
          <line x1="60" y1="80" x2="80" y2="100"/><line x1="80" y1="80" x2="60" y2="100"/>
          <line x1="720" y1="200" x2="740" y2="220"/><line x1="740" y1="200" x2="720" y2="220"/>
          <line x1="40" y1="600" x2="60" y2="620"/><line x1="60" y1="600" x2="40" y2="620"/>
          <line x1="760" y1="700" x2="780" y2="720"/><line x1="780" y1="700" x2="760" y2="720"/>
        </g>
        {/* Circles */}
        <circle cx="100" cy="160" r="30" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.15"
                fill="none" strokeDasharray="6 4"/>
        <circle cx="700" cy="300" r="22" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.12"
                fill="none" strokeDasharray="5 4"/>
        <circle cx="50" cy="780" r="16" stroke="#F9B912" strokeWidth="1" strokeOpacity="0.12"
                fill="none"/>
        <circle cx="760" cy="600" r="28" stroke="#F9B912" strokeWidth="1" strokeOpacity="0.1"
                fill="none" strokeDasharray="7 5"/>
        {/* Dollar / Rupee symbols */}
        <text x="680" y="120" fontSize="32" fill="#F9B912" fillOpacity="0.1" fontWeight="900">₹</text>
        <text x="30" y="420" fontSize="24" fill="#F9B912" fillOpacity="0.1" fontWeight="900">$</text>
        <text x="740" y="820" fontSize="28" fill="#F9B912" fillOpacity="0.08" fontWeight="900">₹</text>
        {/* Corner star */}
        <path d="M760 50 L763 60 L774 60 L765 67 L768 78 L760 71 L752 78 L755 67 L746 60 L757 60 Z"
              fill="#F9B912" fillOpacity="0.15"/>
      </svg>

      {/* Floating sketch icons */}
      <motion.div className="absolute top-16 right-8"
        animate={{ y: [0, -14, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.3"
                  fill="#F9B912" fillOpacity="0.05" strokeDasharray="6 4"/>
          <text x="24" y="30" textAnchor="middle" fontSize="16" fill="#F9B912" opacity="0.5" fontWeight="800">₹</text>
        </svg>
      </motion.div>

      <motion.div className="absolute bottom-32 right-12"
        animate={{ y: [0, -18, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <svg width="44" height="56" viewBox="0 0 44 56" fill="none">
          <rect x="3" y="3" width="38" height="50" rx="5" stroke="#F9B912" strokeWidth="2"
                strokeOpacity="0.25" fill="#F9B912" fillOpacity="0.04" strokeDasharray="5 3"/>
          <line x1="10" y1="16" x2="34" y2="16" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.2"/>
          <line x1="10" y1="24" x2="34" y2="24" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.2"/>
          <line x1="10" y1="32" x2="24" y2="32" stroke="#F9B912" strokeWidth="1.5" strokeOpacity="0.2"/>
          <line x1="22" y1="42" x2="34" y2="42" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.3"/>
        </svg>
      </motion.div>

      <motion.div className="absolute top-1/2 left-6 -translate-y-1/2"
        animate={{ y: [0, -10, 0], x: [0, 4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
        <svg width="52" height="36" viewBox="0 0 52 36" fill="none">
          <path d="M4 18 Q 16 8 28 18 Q 38 26 48 18"
                stroke="#F9B912" strokeWidth="2" strokeOpacity="0.3" fill="none"
                strokeLinecap="round" strokeDasharray="4 3"/>
          <path d="M42 10 L50 18 L42 26" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.35"
                fill="none" strokeLinecap="round"/>
        </svg>
      </motion.div>
    </div>
  );
}

/* ─── LEFT PANEL ─────────────────────────────────────────── */
function LeftPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full p-12 overflow-hidden"
         style={{ background: "linear-gradient(160deg, #111008 0%, #1C1600 50%, #0F0F0F 100%)" }}>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
           style={{ backgroundImage: "linear-gradient(#F9B912 1px,transparent 1px),linear-gradient(90deg,#F9B912 1px,transparent 1px)",
                    backgroundSize: "44px 44px" }}/>

      {/* Sketch art */}
      <DarkSketchArt />

      {/* Ambient amber glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
           style={{ background: AMBER }}/>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl"
           style={{ background: AMBER }}/>

      {/* Top — logo */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }} className="relative z-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Splinzo" width={40} height={40} className="rounded-xl" priority/>
          <span className="text-xl font-black text-white tracking-tight">Splinzo</span>
        </Link>
      </motion.div>

      {/* Middle — floating cards + tagline */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        {/* Tagline */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}>
          <h2 className="text-5xl font-black leading-[1.1] text-white mb-3">
            Split smarter.{" "}
            <span style={{ background: `linear-gradient(135deg,${AMBER},${AMBER_DARK})`,
                           WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                           backgroundClip: "text" }}>
              Stay even.
            </span>
          </h2>
          <p className="text-white/50 text-base font-medium max-w-xs leading-relaxed">
            The smartest way to track expenses with friends and settle up effortlessly.
          </p>
        </motion.div>

        {/* Floating expense cards */}
        <div className="relative h-56 mt-10">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30, x: -10 }} animate={{ opacity: 1, y: [0, -10, 0], x: -10 }}
            transition={{ opacity: { duration: 0.6, delay: 0.5 },
                          y: { duration: 4, delay: 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}}
            className="absolute top-2 left-0 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                     backdropFilter: "blur(12px)" }}>
            <span className="text-2xl">🍕</span>
            <div>
              <div className="text-xs font-bold text-white">Dinner Split</div>
              <div className="text-[10px] text-white/50">3 people</div>
            </div>
            <div className="ml-3 text-sm font-black" style={{ color: AMBER }}>₹1,800</div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30, x: 60 }} animate={{ opacity: 1, y: [0, -14, 0], x: 60 }}
            transition={{ opacity: { duration: 0.6, delay: 0.75 },
                          y: { duration: 5, delay: 1.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}}
            className="absolute top-14 right-4 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                     backdropFilter: "blur(12px)" }}>
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-xs font-bold text-white">Arjun settled up!</div>
              <div className="text-[10px] text-white/50">Balance cleared</div>
            </div>
            <div className="ml-3 text-sm font-black text-emerald-400">₹940</div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30, x: 20 }} animate={{ opacity: 1, y: [0, -8, 0], x: 20 }}
            transition={{ opacity: { duration: 0.6, delay: 1 },
                          y: { duration: 6, delay: 0.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}}
            className="absolute bottom-0 left-8 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                     backdropFilter: "blur(12px)" }}>
            <span className="text-2xl">🏖️</span>
            <div>
              <div className="text-xs font-bold text-white">Goa Trip</div>
              <div className="text-[10px] text-white/50">5 members</div>
            </div>
            <div className="ml-3 text-sm font-black text-sky-400">₹24,500</div>
          </motion.div>
        </div>
      </div>

      {/* Bottom — social proof */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="relative z-10 flex items-center gap-4">
        <div className="flex -space-x-2">
          {["P","R","A","N","K"].map((l, i) => (
            <div key={i} className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shadow-lg"
                 style={{ borderColor: "#111", background: ["#F9B912","#6366F1","#10B981","#F59E0B","#EF4444"][i] }}>
              {l}
            </div>
          ))}
        </div>
        <div>
          <div className="flex gap-0.5 mb-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={AMBER} color={AMBER}/>)}
          </div>
          <div className="text-xs text-white/50 font-medium">Loved by 1,000+ users across India</div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── ANIMATED INPUT ─────────────────────────────────────── */
function AnimatedInput({
  id, label, type, value, onChange, placeholder, autoComplete, error, extra
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; error?: boolean; extra?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      animate={error ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
        {extra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          className="w-full h-13 px-4 py-3.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all duration-200"
          style={{
            height: 52,
            background: focused ? "#FFFFFF" : "#F8F8F8",
            border: `2px solid ${error ? "#EF4444" : focused ? AMBER : "#EBEBEB"}`,
            boxShadow: focused
              ? `0 0 0 4px ${error ? "rgba(239,68,68,0.1)" : "rgba(249,185,18,0.15)"}`
              : "none",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── PASSWORD INPUT ─────────────────────────────────────── */
function PasswordInput({
  id, label, value, onChange, error, extra
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; error?: boolean; extra?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <motion.div
      animate={error ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
        {extra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          autoComplete="current-password"
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          className="w-full px-4 pr-12 py-3.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all duration-200"
          style={{
            height: 52,
            background: focused ? "#FFFFFF" : "#F8F8F8",
            border: `2px solid ${error ? "#EF4444" : focused ? AMBER : "#EBEBEB"}`,
            boxShadow: focused
              ? `0 0 0 4px ${error ? "rgba(239,68,68,0.1)" : "rgba(249,185,18,0.15)"}`
              : "none",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <AnimatePresence mode="wait">
            <motion.div key={show ? "hide" : "show"}
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}>
              {show ? <EyeOff size={17}/> : <Eye size={17}/>}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}

/* ─── MAIN LOGIN PAGE ────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [shake, setShake]       = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to log in.";
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await userService.createUser(user.uid, user.email || "", user.displayName || "User", user.photoURL || "");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to log in with Google.";
      setError(message);
    } finally {
      setGLoading(false);
    }
  };

  /* stagger helpers */
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ── LEFT PANEL ── */}
      <div className="lg:w-[55%] lg:min-h-screen">
        <LeftPanel />
      </div>

      {/* ── RIGHT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FAFAFA 0%, #FFFFFF 100%)" }}
      >
        {/* Subtle amber blob top-right */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
             style={{ background: AMBER }}/>
        {/* Subtle amber blob bottom-left */}
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none"
             style={{ background: AMBER }}/>

        {/* Mobile logo (only on small screens) */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Splinzo" width={36} height={36} className="rounded-xl shadow-sm" priority/>
            <span className="text-xl font-black text-gray-900">Splinzo</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* Logo + Heading */}
          <motion.div {...fadeUp(0.1)} className="mb-8">
            <div className="hidden lg:block mb-6">
              <Image src="/logo.png" alt="Splinzo" width={52} height={52} className="rounded-2xl shadow-md" priority/>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-1.5">Welcome back 👋</h1>
            <p className="text-gray-400 text-sm font-medium">Sign in to your Splinzo account</p>
          </motion.div>

          {/* Google button — prominent at top */}
          <motion.div {...fadeUp(0.2)}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={gLoading || loading}
              className="w-full flex items-center justify-center gap-3 h-13 rounded-2xl font-semibold text-sm text-gray-700 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              style={{
                height: 52,
                background: "white",
                border: "2px solid #EBEBEB",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {gLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin"/>
              ) : <GoogleIcon/>}
              Continue with Google
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div {...fadeUp(0.25)} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100"/>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-gray-400 font-semibold uppercase tracking-widest">
                or with email
              </span>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <motion.div {...fadeUp(0.3)}>
              <AnimatedInput
                id="login-email" label="Email" type="email"
                value={email} onChange={setEmail}
                placeholder="name@example.com" autoComplete="email"
                error={shake && !!error}
              />
            </motion.div>

            <motion.div {...fadeUp(0.35)}>
              <PasswordInput
                id="login-password" label="Password"
                value={password} onChange={setPassword}
                error={shake && !!error}
                extra={
                  <Link href="/forgot-password"
                        className="text-xs font-bold transition-colors hover:opacity-80"
                        style={{ color: AMBER }}>
                    Forgot password?
                  </Link>
                }
              />
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-2xl border border-red-100"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div {...fadeUp(0.4)}>
              <button
                type="submit"
                disabled={loading || gLoading}
                className="w-full h-13 rounded-2xl font-bold text-base transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 relative overflow-hidden group"
                style={{
                  height: 52,
                  background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`,
                  color: "#1a1a1a",
                  boxShadow: "0 4px 24px rgba(249,185,18,0.35)",
                }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                     style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}/>

                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black/70 animate-spin"/>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Log in
                    <ArrowRight size={17}/>
                  </span>
                )}
              </button>
            </motion.div>
          </form>

          {/* Sign up link */}
          <motion.p {...fadeUp(0.45)} className="text-center text-sm text-gray-400 font-medium mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold transition-colors hover:opacity-80"
                  style={{ color: AMBER }}>
              Sign up free
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
