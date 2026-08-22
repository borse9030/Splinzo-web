"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Check, CheckCircle2, ChevronRight, 
  Download, Moon, Play, Shield, ShieldCheck, 
  Sparkles, Star, Wallet, Zap, BookOpen,
  Bell, Users, MessageCircle, ChevronDown, Smartphone,
  Map, CreditCard
} from "lucide-react";

import { blogs } from "@/data/blogs";

/* ─── CONSTANTS ─────────────────────────────────────────── */
const AMBER       = "#F9B912";
const AMBER_DARK  = "#F9A000";
const AMBER_LIGHT = "#FFF8E1";
const PLAY_STORE_URL = "https://play.google.com/apps/testing/com.splinzo.splinzo";

/* ─── SECTION ANIMATION WRAPPER ─────────────────────────── */
function Section({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(48px)",
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── SKETCH ART BACKGROUND SVG ─────────────────────────── */
function SketchArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Wavy doodle lines */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1440 900" fill="none"
           xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {/* Large wavy background line */}
        <path
          d="M-100 300 Q 200 200 400 320 Q 600 440 800 280 Q 1000 120 1200 300 Q 1350 420 1540 280"
          stroke="#F9B912" strokeWidth="2.5" strokeOpacity="0.18" fill="none"
          strokeDasharray="12 8"
          style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}
        />
        <path
          d="M-100 500 Q 300 400 500 520 Q 700 640 900 480 Q 1100 320 1300 480 Q 1420 560 1540 440"
          stroke="#F9B912" strokeWidth="2" strokeOpacity="0.13" fill="none"
          strokeDasharray="16 10"
        />
        {/* Small cross marks */}
        <g stroke="#F9A825" strokeWidth="2.5" strokeOpacity="0.22">
          <line x1="120" y1="80" x2="140" y2="100" /><line x1="140" y1="80" x2="120" y2="100" />
          <line x1="1300" y1="160" x2="1320" y2="180" /><line x1="1320" y1="160" x2="1300" y2="180" />
          <line x1="60" y1="600" x2="80" y2="620" /><line x1="80" y1="600" x2="60" y2="620" />
          <line x1="1380" y1="520" x2="1400" y2="540" /><line x1="1400" y1="520" x2="1380" y2="540" />
        </g>
        {/* Small circles */}
        <circle cx="220" cy="150" r="12" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.2" fill="none" strokeDasharray="6 4"/>
        <circle cx="1250" cy="300" r="18" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.15" fill="none" strokeDasharray="8 5"/>
        <circle cx="80" cy="400" r="8" stroke="#F9A825" strokeWidth="1.5" strokeOpacity="0.2" fill="none"/>
        <circle cx="1400" cy="650" r="14" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.18" fill="none" strokeDasharray="5 4"/>
      </svg>

      {/* Floating sketch icons */}
      {/* Coin top-left */}
      <div className="absolute top-24 left-[6%] animate-float-sketch delay-0">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="25" stroke="#F9B912" strokeWidth="2.5" strokeOpacity="0.45"
                  fill="#FFF8E1" fillOpacity="0.6" strokeDasharray="8 4"/>
          <text x="28" y="34" textAnchor="middle" fontSize="18" fill="#F9A825" opacity="0.7" fontWeight="800">$</text>
        </svg>
      </div>
      {/* Receipt top-right */}
      <div className="absolute top-32 right-[7%] animate-float-sketch-slow delay-500">
        <svg width="44" height="58" viewBox="0 0 44 58" fill="none">
          <rect x="3" y="3" width="38" height="52" rx="5" stroke="#F9B912" strokeWidth="2.5"
                strokeOpacity="0.4" fill="#FFFDE7" fillOpacity="0.5" strokeDasharray="6 3"/>
          <line x1="10" y1="16" x2="34" y2="16" stroke="#F9B912" strokeWidth="1.8" strokeOpacity="0.4"/>
          <line x1="10" y1="24" x2="34" y2="24" stroke="#F9B912" strokeWidth="1.8" strokeOpacity="0.4"/>
          <line x1="10" y1="32" x2="25" y2="32" stroke="#F9B912" strokeWidth="1.8" strokeOpacity="0.4"/>
          <line x1="24" y1="42" x2="34" y2="42" stroke="#F9A825" strokeWidth="2.2" strokeOpacity="0.5"/>
        </svg>
      </div>
      {/* Arrow sketch mid-left */}
      <div className="absolute top-1/2 left-[3%] -translate-y-1/2 animate-float-sketch delay-1000">
        <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
          <path d="M4 20 Q 20 8 40 20 Q 50 26 60 20" stroke="#F9B912" strokeWidth="2.5"
                strokeOpacity="0.4" fill="none" strokeLinecap="round" strokeDasharray="5 3"/>
          <path d="M54 12 L 62 20 L 54 28" stroke="#F9A825" strokeWidth="2.2" strokeOpacity="0.45"
                fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      {/* Group icon bottom-left */}
      <div className="absolute bottom-40 left-[8%] animate-float-sketch-slow delay-2000">
        <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
          <circle cx="18" cy="16" r="10" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.4"
                  fill="#FFF8E1" fillOpacity="0.5"/>
          <circle cx="34" cy="16" r="10" stroke="#F9B912" strokeWidth="2" strokeOpacity="0.3"
                  fill="#FFF8E1" fillOpacity="0.4"/>
          <path d="M4 38 Q 18 28 32 38" stroke="#F9A825" strokeWidth="1.8" strokeOpacity="0.4" fill="none"/>
          <path d="M20 38 Q 34 28 48 38" stroke="#F9A825" strokeWidth="1.8" strokeOpacity="0.35" fill="none"/>
        </svg>
      </div>
      {/* Checkmark bottom-right */}
      <div className="absolute bottom-32 right-[5%] animate-float-sketch delay-1500">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#F9B912" strokeWidth="2.5" strokeOpacity="0.4"
                  fill="#FFFDE7" fillOpacity="0.5"/>
          <path d="M14 24 L 21 31 L 34 17" stroke="#F9A825" strokeWidth="3" strokeOpacity="0.5"
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* Small star top-center */}
      <div className="absolute top-20 left-[45%] animate-float-sketch delay-700">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L18.5 13 L29 13 L20.5 19 L24 29 L16 23 L8 29 L11.5 19 L3 13 L13.5 13 Z"
                stroke="#F9B912" strokeWidth="2" strokeOpacity="0.35" fill="#FFF8E1" fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

/* ─── PHONE MOCKUP WITH CYCLING SCREENS ─────────────────── */
const PHONE_SCREENS = [
  {
    title: "Add Expense",
    subtitle: "Split a dinner bill instantly",
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-amber-50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg" style={{background:"#FFF3CD"}}>🍕</div>
            <div>
              <div className="text-xs font-bold text-gray-800">Dinner at Olive</div>
              <div className="text-[10px] text-gray-400">3 people</div>
            </div>
          </div>
          <div className="text-sm font-black" style={{color:"#F9A825"}}>₹1,800</div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg" style={{background:"#E8F5E9"}}>🛒</div>
            <div>
              <div className="text-xs font-bold text-gray-800">Groceries</div>
              <div className="text-[10px] text-gray-400">2 people</div>
            </div>
          </div>
          <div className="text-sm font-black text-gray-700">₹640</div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg" style={{background:"#E3F2FD"}}>🚕</div>
            <div>
              <div className="text-xs font-bold text-gray-800">Cab Ride</div>
              <div className="text-[10px] text-gray-400">4 people</div>
            </div>
          </div>
          <div className="text-sm font-black text-gray-700">₹380</div>
        </div>
      </div>
    ),
  },
  {
    title: "Smart Split",
    subtitle: "Splinzo does the math for you",
    content: (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{background:"linear-gradient(135deg,#F9B912,#F9A000)"}}>
          <div className="text-xs font-bold text-yellow-900 mb-1">Total Expense</div>
          <div className="text-2xl font-black text-white">₹2,820</div>
          <div className="text-xs text-yellow-100 mt-1">Your share: ₹940</div>
        </div>
        {[{name:"Riya",amt:"₹470",paid:true},{name:"Arjun",amt:"₹940",paid:false},{name:"You",amt:"₹940",paid:true}].map(m=>(
          <div key={m.name} className="flex items-center justify-between bg-white rounded-2xl px-4 py-2.5 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                   style={{background: m.paid ? "#F9B912" : "#E0E0E0"}}>
                {m.name[0]}
              </div>
              <span className="text-xs font-semibold text-gray-700">{m.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">{m.amt}</span>
              {m.paid && <Check size={12} color="#F9A825"/>}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Settle Up",
    subtitle: "Minimal transactions, zero drama",
    content: (
      <div className="flex flex-col gap-3">
        <div className="text-center py-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Outstanding Balance</div>
          <div className="text-3xl font-black" style={{color:"#F9A825"}}>₹470</div>
          <div className="text-xs text-gray-500">Arjun owes you</div>
        </div>
        <div className="rounded-2xl p-4 border-2 border-dashed flex flex-col gap-2" style={{borderColor:"#F9B91250"}}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-lg" style={{color:"#F9A825"}}>A</div>
            <div>
              <div className="text-xs font-bold text-gray-800">Arjun → You</div>
              <div className="text-[10px] text-gray-400">Settle via UPI</div>
            </div>
            <div className="ml-auto text-sm font-black" style={{color:"#F9A825"}}>₹470</div>
          </div>
        </div>
        <button className="w-full py-3 rounded-2xl text-sm font-bold text-white"
                style={{background:"linear-gradient(135deg,#F9B912,#F9A000)"}}>
          Send Reminder 🔔
        </button>
      </div>
    ),
  },
  {
    title: "Group Trips",
    subtitle: "Plan, chat & split all in one place",
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-3">
          <div className="text-2xl">🏖️</div>
          <div>
            <div className="text-xs font-bold text-gray-800">Goa Trip 2025</div>
            <div className="text-[10px] text-gray-500">5 members • ₹24,500 total</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100 flex flex-col gap-2">
          {[{msg:"Riya: Beach hut booked! 🏡",time:"2m"},{msg:"Arjun: Who pays for fuel?",time:"8m"},{msg:"You: I'll add it as expense",time:"10m"}].map(c=>(
            <div key={c.msg} className="flex items-start justify-between gap-2">
              <div className="text-[10px] text-gray-700 flex-1">{c.msg}</div>
              <div className="text-[9px] text-gray-400 shrink-0">{c.time}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-2xl text-center py-2 text-[10px] font-bold border" style={{borderColor:"#F9B912",color:"#F9A825"}}>View Expenses</div>
          <div className="flex-1 rounded-2xl text-center py-2 text-[10px] font-bold text-white" style={{background:"#F9B912"}}>Settle All</div>
        </div>
      </div>
    ),
  },
];

function PhoneMockup() {
  const [screen, setScreen] = useState(0);
  const [prevScreen, setPrevScreen] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevScreen(screen);
      setScreen(s => (s + 1) % PHONE_SCREENS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [screen]);

  const current = PHONE_SCREENS[screen];

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone glow */}
      <div className="absolute inset-0 blur-3xl rounded-full opacity-40 -z-10"
           style={{background:"radial-gradient(ellipse, #F9B912 0%, transparent 70%)"}} />

      {/* Phone shell */}
      <div className="relative w-[265px] h-[530px] rounded-[44px] shadow-2xl flex flex-col overflow-hidden"
           style={{
             background: "linear-gradient(160deg,#1a1a1a 0%,#2d2d2d 100%)",
             boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 0 0 2px #333, inset 0 0 0 1px #444",
           }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-1">
          <span className="text-white text-[10px] font-semibold">9:41</span>
          <div className="h-4 w-20 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-3.5 border border-white/50 rounded-sm">
              <div className="h-full w-3/4 bg-white/60 rounded-sm"/>
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Splinzo" width={26} height={26} className="rounded-md" />
            <span className="text-white font-bold text-sm">Splinzo</span>
          </div>
          <Bell size={16} color="#F9B912" />
        </div>

        {/* Screen area */}
        <div className="flex-1 mx-3 mb-3 rounded-[28px] overflow-hidden bg-gray-50 relative">
          {/* Screen title */}
          <div className="px-4 pt-4 pb-2" style={{background:"#FAFAFA"}}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`title-${screen}`}
                initial={{opacity:0, y:10}}
                animate={{opacity:1, y:0}}
                exit={{opacity:0, y:-10}}
                transition={{duration:0.3}}
              >
                <div className="text-[11px] font-bold" style={{color:"#F9A825"}}>{current.title}</div>
                <div className="text-[10px] text-gray-500">{current.subtitle}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Screen content */}
          <div className="px-3 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`screen-${screen}`}
                initial={{opacity:0, y:20, scale:0.97}}
                animate={{opacity:1, y:0, scale:1}}
                exit={{opacity:0, y:-20, scale:0.97}}
                transition={{duration:0.4}}
              >
                {current.content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav bar */}
        <div className="mx-3 mb-3 rounded-[20px] h-14 flex items-center justify-around px-2"
             style={{background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)"}}>
          {["🏠","👥","📊","👤"].map((ic,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="text-base">{ic}</div>
              {i===0 && <div className="h-1 w-4 rounded-full" style={{background:"#F9B912"}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Screen dots */}
      <div className="flex gap-2 mt-5">
        {PHONE_SCREENS.map((_, i) => (
          <button key={i} onClick={() => setScreen(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === screen ? 24 : 8,
                    height: 8,
                    background: i === screen ? "#F9B912" : "#E0E0E0",
                  }}/>
        ))}
      </div>

      {/* Screen label */}
      <AnimatePresence mode="wait">
        <motion.div key={`label-${screen}`}
                    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="mt-3 text-xs font-semibold text-gray-400 tracking-wide">
          {screen + 1} / {PHONE_SCREENS.length} — {current.title}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        boxShadow: scrolled ? "0 1px 32px rgba(0,0,0,0.07)" : "none",
        borderBottom: scrolled ? "1px solid rgba(249,185,18,0.12)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Splinzo" width={36} height={36} className="rounded-xl shadow-sm" priority />
          <span className="text-xl font-black tracking-tight text-gray-900">Splinzo</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8">
          {[["Features","#features"],["How it Works","#how-it-works"],["Download","#download"],["FAQ","#faq"]].map(([label,href])=>(
            <a key={href} href={href}
               className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Log in
          </Link>
          <Link href="/signup"
                className="px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-md"
                style={{background:AMBER, color:"#1a1a1a"}}>
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={()=>setMobileOpen(!mobileOpen)}>
          <span className={`block h-0.5 w-6 bg-gray-800 transition-all ${mobileOpen?"rotate-45 translate-y-2":""}`}/>
          <span className={`block h-0.5 w-6 bg-gray-800 transition-all ${mobileOpen?"opacity-0":""}`}/>
          <span className={`block h-0.5 w-6 bg-gray-800 transition-all ${mobileOpen?"-rotate-45 -translate-y-2":""}`}/>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                      className="md:hidden overflow-hidden bg-white border-t border-gray-100">
            <div className="flex flex-col px-5 py-4 gap-4">
              {[["Features","#features"],["How it Works","#how-it-works"],["Download","#download"],["FAQ","#faq"]].map(([label,href])=>(
                <a key={href} href={href} onClick={()=>setMobileOpen(false)}
                   className="text-sm font-semibold text-gray-700">{label}</a>
              ))}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Link href="/login" className="flex-1 text-center py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700">
                  Log in
                </Link>
                <Link href="/signup" className="flex-1 text-center py-2.5 rounded-full text-sm font-bold text-gray-900"
                      style={{background:AMBER}}>
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── FEATURES DATA ──────────────────────────────────────── */
const FEATURES = [
  { icon: Zap,           color:"#F9B912", bg:"#FFF8E1", title:"Smart Splitting",    desc:"Our algorithm minimizes total transactions so everyone settles up faster with fewer payments." },
  { icon: Users,         color:"#6366F1", bg:"#EEF2FF", title:"Group Management",   desc:"Create unlimited groups for roommates, travel buddies, couples, and office teams." },
  { icon: Map,           color:"#10B981", bg:"#D1FAE5", title:"Trip Planning",      desc:"Organize group trips with built-in itinerary tools and per-trip expense tracking." },
  { icon: MessageCircle, color:"#F59E0B", bg:"#FEF3C7", title:"In-App Chat",        desc:"Keep all conversations next to the expenses they're about — no context switching." },
  { icon: Bell,          color:"#EF4444", bg:"#FEE2E2", title:"Smart Reminders",    desc:"Gentle nudges that help you collect money without awkward conversations." },
  { icon: Shield,        color:"#3B82F6", bg:"#DBEAFE", title:"Bank-Grade Security", desc:"Your financial data is encrypted end-to-end and never sold to third parties." },
];

/* ─── HOW IT WORKS DATA ──────────────────────────────────── */
const STEPS = [
  { num:"01", emoji:"👥", title:"Create a Group",     desc:"Add your friends, roommates, or trip mates with one tap. They'll get an instant invite." },
  { num:"02", emoji:"💸", title:"Log Any Expense",    desc:"Add expenses on the go — dinner, rent, tickets, anything. Set who paid and how to split." },
  { num:"03", emoji:"✅", title:"Settle & Stay Even", desc:"Splinzo calculates the minimal set of payments. Mark settled and move on." },
];

/* ─── TESTIMONIALS DATA ──────────────────────────────────── */
const TESTIMONIALS = [
  { name:"Priya S.", role:"Frequent Traveller", stars:5, text:"Splinzo saved our Goa trip! No more WhatsApp chaos about who owes what. Everything was perfectly calculated 🙌" },
  { name:"Rahul M.", role:"Roommate Group Admin", stars:5, text:"We manage 4 roommates and 20+ monthly expenses. Splinzo makes rent & utilities settlement completely effortless." },
  { name:"Ananya K.", role:"College Student",    stars:5, text:"The chat + expense combo is genius. I stopped using two different apps and Splinzo replaced both perfectly." },
];

/* ─── FAQ DATA ───────────────────────────────────────────── */
const FAQS = [
  { q:"Is Splinzo free to use?",                    a:"Yes! Splinzo is completely free for all core features — creating groups, splitting expenses, and settling up. We may offer premium features in the future." },
  { q:"Which platforms is Splinzo available on?",   a:"Splinzo is available on Android (Google Play Store) and on the web. iOS support is coming soon!" },
  { q:"How does the smart split algorithm work?",   a:"Our algorithm computes the optimal set of transactions to settle all debts in a group with the fewest possible payments — similar to debt consolidation." },
  { q:"Is my financial data safe?",                 a:"Absolutely. We use Firebase with industry-standard encryption. We never store payment credentials and never sell your data." },
  { q:"Can I use Splinzo for personal expense tracking?", a:"Yes! You can create a solo group or use it alongside friends. It's flexible enough for personal budgets too." },
];

/* ─── FAQ ITEM ───────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-base">{q}</span>
        <ChevronDown
          size={18} className="shrink-0 transition-transform duration-300 text-gray-400"
          style={{transform: open ? "rotate(180deg)" : "rotate(0deg)"}}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            transition={{duration:0.3}}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white" style={{fontFamily:"'Outfit', sans-serif"}}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-20"
             style={{background:"radial-gradient(ellipse 90% 70% at 50% 0%, #FFF9E6 0%, #FFFDF6 45%, #FFFFFF 100%)"}} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.04]"
             style={{backgroundImage:"linear-gradient(#F9B912 1px, transparent 1px), linear-gradient(90deg, #F9B912 1px, transparent 1px)",
                     backgroundSize:"48px 48px"}} />
        {/* Sketch art */}
        <SketchArt />

        <div className="max-w-7xl mx-auto px-5 w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div>
            <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-7"
                    style={{background:"#FFF3CD", color:"#B8860B"}}>
                <span className="h-2 w-2 rounded-full animate-pulse" style={{background:AMBER}}/>
                Now available on Android & Web
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-[1.08]">
                Split expenses.{" "}
                <span className="block"
                      style={{background:"linear-gradient(135deg,#F9A825,#FF8F00,#F9B912)",
                              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"}}>
                  Stay even.
                </span>
              </h1>

              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
                Splinzo is the smartest way to share expenses with friends, roommates, and groups.
                Know exactly who owes what and settle up in one tap — no awkward conversations.
              </p>

              <div className="flex flex-wrap gap-4">
                {/* Play Store CTA */}
                <a href="#" onClick={(e) => { e.preventDefault(); alert("App will be available soon!"); }}
                   className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-white font-bold text-base transition-transform hover:scale-105 shadow-xl"
                   style={{background:"linear-gradient(135deg,#1a1a1a,#2d2d2d)"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3.18 23.4C3.06 23.08 3 22.73 3 22.37V1.63C3 1.27 3.06.92 3.18.6L13.5 12 3.18 23.4Z" fill="#EA4335"/>
                    <path d="M17.53 15.87L4.91 23.1C4.55 23.31 4.18 23.42 3.82 23.42L13.5 12l4.03 3.87Z" fill="#FBBC04"/>
                    <path d="M17.53 8.13L13.5 12 3.82.58C4.18.58 4.55.69 4.91.9L17.53 8.13Z" fill="#4285F4"/>
                    <path d="M20.82 10.54C21.36 10.88 21.73 11.4 21.73 12s-.37 1.12-.91 1.46l-3.29 1.91L13.5 12l4.03-3.87 3.29 2.41Z" fill="#34A853"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] font-normal opacity-80">GET IT ON</div>
                    <div className="text-sm font-black leading-none">Google Play</div>
                  </div>
                </a>

                {/* Web app CTA */}
                <Link href="/signup"
                      className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-base transition-transform hover:scale-105 shadow-md"
                      style={{background:AMBER, color:"#1a1a1a"}}>
                  Try for Free
                  <ArrowRight size={18}/>
                </Link>
              </div>

              {/* Social proof mini */}
              <div className="flex items-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {["P","R","A","N"].map((l,i)=>(
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow"
                         style={{background:["#F9B912","#6366F1","#10B981","#F59E0B"][i]}}>
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex">
                    {[1,2,3,4,5].map(s=><Star key={s} size={12} fill="#F9A825" color="#F9A825"/>)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Loved by 1,000+ users</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — Phone */}
          <motion.div initial={{opacity:0,x:48}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.2}}
                      className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* ══ STATS BAR ══════════════════════════════════════ */}
      <Section className="bg-gray-900 py-12">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            {label:"Active Users",    value:"1,000+"},
            {label:"Expenses Split",  value:"50,000+"},
            {label:"Groups Created",  value:"5,000+"},
            {label:"Money Settled",   value:"₹10L+"},
          ].map(s=>(
            <div key={s.label}>
              <div className="text-3xl font-black mb-1" style={{color:AMBER}}>{s.value}</div>
              <div className="text-sm text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest" style={{color:AMBER}}>How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">
              Three steps to <span style={{color:AMBER}}>financial</span> peace
            </h2>
          </Section>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed"
                 style={{borderColor:"#F9B91240"}}/>
            {STEPS.map((step, i) => (
              <Section key={step.num} delay={i * 0.15}>
                <div className="flex flex-col items-center text-center p-8 rounded-3xl hover:shadow-lg transition-shadow"
                     style={{background: i===1 ? "linear-gradient(135deg,#FFF8E1,#FFF3CD)" : "white",
                             border: "1px solid #F5F5F5"}}>
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm"
                       style={{background: AMBER_LIGHT}}>
                    {step.emoji}
                  </div>
                  <div className="text-xs font-black tracking-widest mb-2" style={{color:AMBER}}>{step.num}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════ */}
      <section id="features" className="py-28 px-5"
               style={{background:"linear-gradient(180deg,#FAFAFA 0%,#FFF9ED 100%)"}}>
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest" style={{color:AMBER}}>Features</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">
              Everything you need to <span style={{color:AMBER}}>split smarter</span>
            </h2>
          </Section>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Section key={f.title} delay={i * 0.08}>
                  <div className="group bg-white border border-gray-100 p-7 rounded-3xl shadow-sm
                                  hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
                    <div className="h-13 w-13 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                         style={{background:f.bg, width:52, height:52}}>
                      <Icon size={24} style={{color:f.color}}/>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </Section>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ APP DOWNLOAD BANNER ════════════════════════════ */}
      <section id="download" className="py-24 px-5 overflow-hidden relative"
               style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 60%,#1a1a1a 100%)"}}>
        {/* Amber blob */}
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full blur-3xl opacity-20"
             style={{background:AMBER}}/>
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full blur-3xl opacity-10"
             style={{background:AMBER}}/>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Section>
            <div className="flex justify-center mb-6">
              <Smartphone size={48} style={{color:AMBER}}/>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Get Splinzo on{" "}
              <span style={{color:AMBER}}>Android</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Download the app and split your first expense in under 60 seconds.
              It&apos;s completely free.
            </p>

            <a href="#" onClick={(e) => { e.preventDefault(); alert("App will be available soon!"); }}
               className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl text-white font-bold text-lg
                          transition-all hover:scale-105 shadow-2xl animate-pulse-glow"
               style={{background:"linear-gradient(135deg,#F9B912,#F9A000)"}}>
              <Download size={22} style={{color:"#1a1a1a"}}/>
              <span style={{color:"#1a1a1a"}}>Download on Google Play</span>
            </a>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {["Free Forever","No Ads","Offline Support","Instant Sync"].map(p=>(
                <span key={p} className="px-4 py-1.5 rounded-full text-sm font-semibold"
                      style={{background:"rgba(249,185,18,0.15)", color:"#F9B912", border:"1px solid rgba(249,185,18,0.25)"}}>
                  ✓ {p}
                </span>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════ */}
      <section className="py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest" style={{color:AMBER}}>Reviews</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">
              Loved by users <span style={{color:AMBER}}>everywhere</span>
            </h2>
          </Section>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Section key={t.name} delay={i * 0.1}>
                <div className="p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="flex mb-4">
                    {Array(t.stars).fill(0).map((_,s)=>(
                      <Star key={s} size={16} fill={AMBER} color={AMBER}/>
                    ))}
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed flex-1 mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                         style={{background:`linear-gradient(135deg,${AMBER},${AMBER_DARK})`}}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════ */}
      <section id="faq" className="py-28 px-5" style={{background:"#FAFAFA"}}>
        <div className="max-w-3xl mx-auto">
          <Section className="text-center mb-14">
            <span className="text-sm font-bold uppercase tracking-widest" style={{color:AMBER}}>FAQ</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">
              Got <span style={{color:AMBER}}>questions?</span>
            </h2>
          </Section>

          <Section>
            <div className="flex flex-col gap-3">
              {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a}/>)}
            </div>
          </Section>
        </div>
      </section>

      {/* ══ BLOG / RESOURCES ═══════════════════════════════ */}
      <Section className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
                    style={{ background: "#FFF8E1", color: "#F9A825" }}>
                <BookOpen size={14} />
                Resources
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
                Latest from the <span style={{ color: AMBER }}>Blog</span>
              </h2>
            </div>
            <Link href="/blog" className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-amber-500 transition-colors">
              View all articles <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {blogs.slice(0, 3).map((blog, i) => (
              <motion.div key={blog.slug} whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
                <Link href={`/blog/${blog.slug}`} className="block group">
                  <article className="bg-gray-50 rounded-3xl p-6 h-full flex flex-col border border-gray-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                    <span className="text-xs font-bold text-amber-500 mb-3">{blog.category}</span>
                    <h3 className="text-lg font-black text-gray-900 mb-3 group-hover:text-amber-500 transition-colors leading-snug">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 leading-relaxed">
                      {blog.summary}
                    </p>
                    <div className="flex items-center text-xs font-bold text-gray-400 group-hover:text-amber-500 transition-colors gap-1">
                      Read Article <ChevronRight size={14} />
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══ FOOTER ═════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.png" alt="Splinzo" width={36} height={36} className="rounded-xl shadow-md" />
                <span className="text-xl font-black text-white">Splinzo</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-5">
                The smartest way to split expenses with friends, roommates, and groups.
                Track, split, and settle — effortlessly.
              </p>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105"
                 style={{background:AMBER, color:"#1a1a1a"}}>
                <Download size={16}/>
                Get on Play Store
              </a>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">Download App</a></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog & Guides</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Get Started Free</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs">© {new Date().getFullYear()} Splinzo. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
