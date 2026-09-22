"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Utensils,
  Sparkles,
  ShoppingCart,
  Receipt,
  Coins,
  Phone,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Check,
} from "lucide-react";

interface FlatHqGuidebookModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function FlatHqGuidebookModal({
  open,
  onOpenChange,
  onClose,
}: FlatHqGuidebookModalProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const rules = [
    {
      id: "water",
      tabTitle: "1. Water",
      icon: Droplets,
      color: "#0284C7",
      ruleNumber: "1",
      title: "The 20L Water Can Covenant",
      tagline: "Never stay thirsty. Fair rotation with 1-tap cost split.",
      problem:
        "The drinking water plant is 1 to 2 km away, and carrying a 20 kg can is exhausting. In bachelor flats, roommates often make excuses or delay going, leaving the flat completely out of drinking water.",
      goldenRule:
        "If you drink the last glass or find the can empty, you do NOT pretend you didn't see it. Check whose turn it is on the timetable.",
      steps: [
        "Live Can Level: Anyone can tap Full 🟢, Half 🟡, or Empty 🚨 on the card so everyone knows the status in real time.",
        "Got Can & Split: The assigned flatmate brings the can, enters the cost (₹40-₹50), and taps 'Got Can & Split'.",
        "Auto-Advance: Splinzo divides the cost equally with all roommates into the group and automatically passes the turn to the next person.",
      ],
      antiCheat:
        "Anti-Cheat & Swaps: Busy with exams or office? Use 'Swap Duty' to trade turns fairly with another flatmate. Only the group Admin can change the master 7-day schedule.",
    },
    {
      id: "meals",
      tabTitle: "2. Cook",
      icon: Utensils,
      color: "#EA580C",
      ruleNumber: "2",
      title: 'Cook Headcount ("Aaj Khana Kaun Khayega?")',
      tagline: "Zero food wastage. Exact headcount ready before cook arrives.",
      problem:
        "Cook aunty or bhaiya arrives and asks how many rotis to make. When flatmates eat out without telling, expensive groceries and food are wasted. If more eat at home unexpectedly, food falls short.",
      goldenRule:
        "Cast your meal vote before cooking starts (Lunch before 11:00 AM, Dinner before 6:00 PM). No excuses.",
      steps: [
        "Vote in 1 Tap: Tap Home 🏠 if eating at the flat, Out 🏢 if dining out or at office, or Skip ⏭️ if fasting.",
        "Live Flat Summary: See exact counts and names of who is eating Lunch and Dinner today.",
        "WhatsApp Cook: Tap 'WhatsApp Cook' to send a pre-formatted message directly to your cook in 1 second.",
      ],
      antiCheat:
        "Direct Transparency: Every flatmate's vote is visible in real-time, completely ending 'I thought you were eating out' arguments.",
    },
    {
      id: "chores",
      tabTitle: "3. Chores",
      icon: Sparkles,
      color: "#7C3AED",
      ruleNumber: "3",
      title: "Cleaning & Garbage Duty Roster",
      tagline: "Clean flat, zero drama. Turn rotation with Karma points.",
      problem:
        "Garbage bags piling up at the door, messy kitchen sink full of greasy plates, or dirty washrooms because 'it was someone else's turn' causes the biggest arguments among roommates.",
      goldenRule:
        "Do your assigned chore on your day. A clean flat is everyone's responsibility.",
      steps: [
        "Duty Roster: Preset schedule for Daily Trash, Kitchen Sink, Hall Sweep & Mop, Washroom, and Milk run.",
        "Mark Done & Earn Karma: Tap 'Mark Done' when you finish to earn +15 Karma points.",
        "Bought Supplies?: If you purchased garbage bags, Harpic, or detergent, enter the cost to automatically split it with all flatmates.",
        "Automatic Rotation: Once marked done, the assignment automatically passes to the next roommate in line.",
      ],
      antiCheat:
        "Fair Baton Passing: Chores rotate systematically so no single roommate ends up doing all the dirty work.",
    },
    {
      id: "pantry",
      tabTitle: "4. Pantry",
      icon: ShoppingCart,
      color: "#0D9488",
      ruleNumber: "4",
      title: 'Shared Pantry: "Who Buys Next?"',
      tagline: "Cooking oil, spices, and groceries without checkout confusion.",
      problem:
        "Cooking oil, salt, tea powder, or dishwash gel finishes in the middle of cooking. Flatmates argue over who bought it last time and nobody wants to pay twice in a row.",
      goldenRule:
        "The 'Next Buyer' badge tells everyone exactly whose turn it is to buy the refill.",
      steps: [
        "Live Stock Levels: Every staple shows In Stock 🟢, Low 🟡, or Out 🔴.",
        "Next Buyer Badge: Clear indicator showing who is next in line to purchase.",
        "Restock & Split: When you buy the refill, tap 'Restock & Split'. Enter the amount and Splinzo splits it across all flatmates.",
        "Circular Baton: The buyer badge automatically rotates to the next roommate.",
      ],
      antiCheat:
        "No Guesswork: History log records who bought each item and when, so nobody can claim 'I always buy the oil'.",
    },
    {
      id: "bills",
      tabTitle: "5. Bills",
      icon: Receipt,
      color: "#4F46E5",
      ruleNumber: "5",
      title: "Monthly Bachelor Fixed Bills Checklist",
      tagline: "Rent, Wi-Fi, Maid, and Electricity split with 1 click.",
      problem:
        "Tracking recurring due dates across WhatsApp chats leads to late rent penalties, Wi-Fi disconnections, or maid salary confusion.",
      goldenRule:
        "All shared monthly commitments tracked on one central flat checklist with clear due dates.",
      steps: [
        "Monthly Checklist: Rent (due 1st), Wi-Fi (due 5th), Maid Salary (due 7th), Electricity (due 15th).",
        "Whoever Pays Splits: Whoever transfers money to landlord or service provider taps 'Split Bill'.",
        "Stamped for the Month: The bill is marked 'Paid for this month' with date and amount, preventing duplicate payments.",
      ],
      antiCheat:
        "Permanent Record: Every paid bill links to an expense in Splinzo, ensuring clear payment proof for all roommates.",
    },
    {
      id: "guilt_jar",
      tabTitle: "6. Guilt Jar",
      icon: Coins,
      color: "#D97706",
      ruleNumber: "6",
      title: "The Bachelor Guilt Jar & Party Pot",
      tagline: "Turn flat violations into a weekend pizza & biryani feast! 🍕🍻",
      problem:
        "Leaving AC on all day while at office, leaving unwashed dishes in the sink, or skipping chore duty causes annoyance that is awkward to constantly confront.",
      goldenRule:
        "Don't fight or hold grudges—drop ₹50 into the Guilt Jar!",
      steps: [
        "Friendly Penalties: Flatmates log micro-fines (₹20, ₹50, ₹100) for agreed infractions (AC left on, lights on, messy table).",
        "Party Pot Accumulation: Fines pool into a shared transparent Party Pot.",
        "Weekend Celebration: Once the pot reaches ₹500 or ₹1000, tap 'Cash Out Party Pot' to order weekend pizza, biryani, or chai snacks for the entire flat!",
      ],
      antiCheat:
        "Social Contract: Petty grievances turn into fun weekend feasts that everyone enjoys together.",
    },
    {
      id: "contacts",
      tabTitle: "7. SOS",
      icon: Phone,
      color: "#16A34A",
      ruleNumber: "7",
      title: "Shared Flat Emergency Contacts",
      tagline: "Water delivery guy, Cook, Maid & Landlord always reachable.",
      problem:
        "When the water can finishes or a pipe leaks while only one flatmate is home, they don't have the vendor's number and have to spam the group chat.",
      goldenRule:
        "All essential house numbers stored in one shared directory for the flat.",
      steps: [
        "Central Phonebook: Water Delivery, Cook, Maid, Society Guard, Landlord, and Plumber.",
        "1-Tap Call: Tap the Phone icon to dial the vendor immediately.",
        "1-Tap WhatsApp: Tap WhatsApp to message them with flat details.",
      ],
      antiCheat:
        "Group Stored: Contacts stay with the flat group permanently even if roommates switch phones.",
    },
  ];

  const cur = rules[currentPage];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-[#FBF9F4] dark:bg-[#181E29] text-gray-900 dark:text-gray-100">
        <DialogHeader className="sr-only">
          <DialogTitle>Flat HQ Handbook & Rules Notebook</DialogTitle>
        </DialogHeader>

        {/* ── TOP STICKY BOOKMARK INDEX TABS ── */}
        <div className="bg-[#EFECE6] dark:bg-[#0F141C] px-3 py-2 border-b border-border/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-[10px] font-black tracking-widest text-gray-500 shrink-0 ml-1">
              📓 NOTEBOOK
            </span>
            {rules.map((r, idx) => {
              const isSel = idx === currentPage;
              return (
                <button
                  key={r.id}
                  onClick={() => setCurrentPage(idx)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
                  style={{
                    background: isSel ? r.color : "transparent",
                    color: isSel ? "#ffffff" : "var(--muted-foreground)",
                    boxShadow: isSel ? `0 2px 8px ${r.color}40` : "none",
                    border: isSel ? `1px solid ${r.color}` : "1px solid rgba(120,120,120,0.2)",
                  }}
                >
                  {r.tabTitle}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── NOTEBOOK BODY (Ring Binder Spine + Ruled Paper) ── */}
        <div className="flex min-h-[460px] max-h-[75vh] overflow-hidden">
          {/* Spiral Ring Binder Spine (Left Edge) */}
          <div className="w-7 shrink-0 bg-[#E8E4DC] dark:bg-[#131822] border-r border-[#D6D0C4] dark:border-white/10 flex flex-col justify-around items-center py-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="w-3.5 h-2.5 rounded-full bg-gradient-to-br from-gray-400 via-slate-200 to-gray-600 shadow-sm"
              />
            ))}
          </div>

          {/* Ruled Paper Content Area */}
          <div
            className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 relative"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 27px, rgba(59, 130, 246, 0.06) 28px)",
            }}
          >
            {/* Pink / Rose vertical margin line */}
            <div className="absolute top-0 bottom-0 left-4 w-px bg-rose-400/40 pointer-events-none" />

            {/* Header: Rule number & Verified Stamp */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: cur.color }}
              >
                RULE #{cur.ruleNumber} • PAGE {currentPage + 1} OF 7
              </span>
              <span
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border"
                style={{
                  color: cur.color,
                  borderColor: `${cur.color}60`,
                  background: `${cur.color}15`,
                }}
              >
                FLAT PACT ✓
              </span>
            </div>

            {/* Title & Tagline */}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {cur.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold mt-1" style={{ color: cur.color }}>
              {cur.tagline}
            </p>

            <div className="my-5 space-y-4">
              {/* 1. The Reality (Problem) */}
              <div className="p-3.5 rounded-2xl bg-[#F3F0E9] dark:bg-[#222B38] border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span>📌</span>
                  <span className="text-[10px] font-black tracking-wider text-gray-500 uppercase">
                    THE SITUATION
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {cur.problem}
                </p>
              </div>

              {/* 2. The Golden House Rule */}
              <div
                className="p-3.5 rounded-2xl border"
                style={{
                  background: `${cur.color}12`,
                  borderColor: `${cur.color}40`,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span>⚖️</span>
                  <span
                    className="text-[10px] font-black tracking-wider uppercase"
                    style={{ color: cur.color }}
                  >
                    THE GOLDEN HOUSE RULE
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold leading-relaxed text-gray-900 dark:text-white">
                  {cur.goldenRule}
                </p>
              </div>

              {/* 3. How to Use in Splinzo */}
              <div>
                <span className="text-[10px] font-black tracking-wider text-gray-500 uppercase block mb-2">
                  🚀 HOW TO USE IN SPLINZO
                </span>
                <div className="space-y-2">
                  {cur.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5"
                        style={{ background: cur.color }}
                      >
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Anti-Cheat & Swaps */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium text-amber-900 dark:text-amber-200">
                  {cur.antiCheat}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── NOTEBOOK FOOTER CONTROLS ── */}
        <div className="bg-[#EFECE6] dark:bg-[#0F141C] px-5 py-3 border-t border-border/80 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="gap-1 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Prev Rule
          </Button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {rules.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: i === currentPage ? cur.color : "rgba(120,120,120,0.3)",
                  transform: i === currentPage ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {currentPage < rules.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              className="gap-1 text-xs font-bold text-white shadow-sm cursor-pointer"
              style={{ background: cur.color }}
            >
              Next Rule
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleClose}
              className="gap-1 text-xs font-black bg-amber-400 hover:bg-amber-500 text-black shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Got It! 🤝
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
