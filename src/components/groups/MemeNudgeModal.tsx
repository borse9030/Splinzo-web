"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Smile, Send, X, Sparkles } from "lucide-react";

interface MemePreset {
  id: string;
  emoji: string;
  title: string;
  generateText: (name: string, amount: string, currency: string) => string;
}

const PRESETS: MemePreset[] = [
  {
    id: "priceless",
    emoji: "🎭",
    title: "Priceless Friendship",
    generateText: (name, amount, curr) =>
      `Friendship is priceless. This ${curr}${amount} bill is not. 😉 Time to settle up, ${name}!`,
  },
  {
    id: "sos",
    emoji: "📉",
    title: "Bank SOS",
    generateText: (name, amount, curr) =>
      `Mayday! My bank account just sent an SOS signal 🚨 ${name}, rescue me with that ${curr}${amount}!`,
  },
  {
    id: "coffee",
    emoji: "☕",
    title: "Coffee Fund",
    generateText: (name, amount, curr) =>
      `Buy me a coffee or just settle that ${curr}${amount} so I can buy 4 of them. ☕✨`,
  },
  {
    id: "waiting",
    emoji: "⏳",
    title: "Still Buffering",
    generateText: (name, amount, curr) =>
      `Waiting for ${name} to settle ${curr}${amount} like... (99% buffered for 3 weeks) ⏳💀`,
  },
  {
    id: "pizza",
    emoji: "🍕",
    title: "The Lonely Slice",
    generateText: (name, amount, curr) =>
      `That food we had still remembers you! Settle your ${curr}${amount} share before the memory fades 🍕`,
  },
  {
    id: "piper",
    emoji: "🚀",
    title: "Moon Mission",
    generateText: (name, amount, curr) =>
      `To the moon! 🚀 But first, let’s bring that ${curr}${amount} back to earth, ${name}!`,
  },
];

interface MemeNudgeModalProps {
  groupId: string;
  targetUid: string;
  targetName: string;
  amount: number;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemeNudgeModal({
  groupId,
  targetUid,
  targetName,
  amount,
  currency,
  isOpen,
  onClose,
}: MemeNudgeModalProps) {
  const { appUser } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedPreset = PRESETS[selectedIndex];
  const formattedAmount = amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const memeText = selectedPreset.generateText(targetName, formattedAmount, currency);

  const handleSend = async () => {
    if (!appUser) return;
    setIsSending(true);

    try {
      await addDoc(collection(db, "groups", groupId, "messages"), {
        groupId,
        senderId: appUser.id,
        type: "nudge",
        nudgeTargetUid: targetUid,
        nudgeTargetName: targetName,
        nudgeAmount: amount,
        nudgeMemeTitle: `${selectedPreset.emoji} ${selectedPreset.title}`,
        nudgeMemeText: memeText,
        createdAt: serverTimestamp(),
      });

      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Failed to send meme nudge:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 font-bold">
              <Smile className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-900 flex items-center gap-1.5">
                Playful Meme Nudge <Sparkles className="h-4 w-4 text-amber-500" />
              </h4>
              <p className="text-xs text-slate-500">
                Remind {targetName} about {currency}
                {formattedAmount} with humor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PRESETS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedIndex(idx)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                idx === selectedIndex
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{p.emoji}</span>
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Live Preview Card */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 p-5 border border-amber-200/80 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider">
              {selectedPreset.emoji} SPLINZO NUDGE
            </span>
            <span className="font-extrabold text-sm text-amber-900">
              {currency}
              {formattedAmount}
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-amber-950 leading-relaxed">
            {memeText}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSending || sentSuccess}
            onClick={handleSend}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold shadow-md transition flex items-center justify-center gap-2 ${
              sentSuccess
                ? "bg-emerald-500 text-white"
                : "bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            }`}
          >
            {sentSuccess ? (
              "Nudge Sent! 🚀"
            ) : isSending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4" /> Drop in Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
