"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Sparkles,
  Check,
  AlertCircle,
  Users,
  User,
  ArrowRight,
  ExternalLink,
  Volume2,
  RefreshCw,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseExpenseText, ParsedWebExpense } from "@/lib/nlpExpenseParser";
import { expenseService } from "@/services/expenseService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const AMBER = "#F9B912";

interface VoiceExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: any;
  onExpenseAdded?: () => void;
}

export default function VoiceExpenseModal({
  open,
  onOpenChange,
  group,
  onExpenseAdded,
}: VoiceExpenseModalProps) {
  const { appUser } = useAuth();
  const router = useRouter();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedWebExpense | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isManuallyStopped = useRef(false);

  const quickVoiceExamples = [
    "Dinner 1200 paid by me",
    "Dinner done by me 1200",
    "Uber 350 for all",
    "1200 ka petrol split with all",
    "Chai 150 split with Rahul",
    "Rahul ne diya 500 coffee",
    "Groceries 1850",
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Default to Indian English, handles Hinglish and English accents

    recognition.onresult = (event: any) => {
      if (isManuallyStopped.current) return;

      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript + " ";
      }
      currentText = currentText.trim();
      setTranscript(currentText);

      // Instant Local Parsing
      const localParsed = parseExpenseText(currentText, group, appUser?.id);
      setParsed(localParsed);
    };

    recognition.onerror = (event: any) => {
      console.warn("[SpeechRecognition] Error:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (!isManuallyStopped.current && open) {
        // Automatically restart if user was still in listening mode
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [group, appUser?.id, open]);

  // When modal opens, auto-start listening after short transition
  useEffect(() => {
    if (open) {
      isManuallyStopped.current = false;
      setTranscript("");
      setParsed(null);
      setErrorMsg(null);
      setSuccessMsg(null);

      const timer = setTimeout(() => {
        startListening();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      stopListening();
    }
  }, [open]);

  // Live Local Parsing on Transcript Change
  const handleTranscriptChange = (newText: string) => {
    setTranscript(newText);
    if (!newText.trim()) {
      setParsed(null);
      return;
    }
    const localParsed = parseExpenseText(newText, group, appUser?.id);
    setParsed(localParsed);
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      isManuallyStopped.current = false;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already running or permission needed
      setIsListening(true);
    }
  };

  const stopListening = () => {
    isManuallyStopped.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);

    // If local parser couldn't find amount, trigger Gemini fallback
    if (transcript.trim().length > 3 && (!parsed?.amount || parsed.amount <= 0)) {
      refineWithGemini(transcript, true);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Gemini AI Fallback & Refinement
  const refineWithGemini = async (textToRefine: string, silent = false) => {
    if (!textToRefine.trim() || isAiRefining) return;

    try {
      setIsAiRefining(true);
      setErrorMsg(null);

      const res = await fetch("/api/expenses/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToRefine,
          groupMembers: group?.members || [],
          currentUserId: appUser?.id,
          currentUserName: appUser?.displayName || appUser?.name || "You",
          groupName: group?.name || "Group",
        }),
      });

      if (!res.ok) {
        throw new Error("AI refinement unavailable");
      }

      const json = await res.json();
      if (json.success && json.parsed && json.parsed.amount) {
        setParsed(json.parsed);
      } else if (!silent) {
        setErrorMsg("AI could not determine amount. You can edit the text directly.");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err: any) {
      if (!silent) {
        setErrorMsg("AI refinement failed. You can still log or edit manually.");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } finally {
      setIsAiRefining(false);
    }
  };

  // Submit Expense to Firestore
  const handleSaveExpense = async () => {
    if (!parsed || !parsed.amount || parsed.amount <= 0 || !group || !appUser) {
      setErrorMsg("Please mention an amount, e.g. 'Dinner 1200'");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const splitBetweenIds =
        parsed.splitMemberIds.length > 0
          ? parsed.splitMemberIds
          : group.members.map((m: any) => m.id);

      await expenseService.addExpense(group.id, {
        description: parsed.title,
        amount: parsed.amount,
        currency: group.currency || "INR",
        payerId: parsed.payerId || appUser.id,
        splitBetweenIds,
        category: parsed.category,
        splitMode: "equal",
        originalAmount: parsed.amount,
        originalCurrency: group.currency || "INR",
        createdBy: appUser.id,
        isRecurring: false,
      });

      const curr = group.currency === "INR" ? "₹" : (group.currency || "₹");
      setSuccessMsg(`Logged "${parsed.title}" (${curr}${parsed.amount})!`);

      if (onExpenseAdded) onExpenseAdded();

      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log expense");
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenFullEditor = () => {
    if (!parsed) {
      router.push(`/groups/${group.id}/expenses/new`);
      return;
    }
    const q = new URLSearchParams();
    if (parsed.amount) q.set("amount", String(parsed.amount));
    if (parsed.title) q.set("description", parsed.title);
    if (parsed.category) q.set("category", parsed.category);
    onOpenChange(false);
    router.push(`/groups/${group.id}/expenses/new?${q.toString()}`);
  };

  const currencySymbol = group?.currency === "INR" ? "₹" : (group?.currency || "₹");
  const hasAmount = Boolean(parsed?.amount && parsed.amount > 0);

  // Helper to summarize split members
  const getSplitSummary = () => {
    if (!parsed) return "";
    const totalMembers = group?.members?.length || 0;
    const selectedCount = parsed.splitMemberIds.length;
    if (selectedCount === totalMembers || selectedCount === 0) {
      return `Split with all (${totalMembers})`;
    }

    const names = parsed.splitMemberIds.map((id) => {
      if (id === appUser?.id) return "You";
      const m = group?.members?.find((gm: any) => gm.id === id);
      return m ? (m.name || m.displayName || "Member").split(" ")[0] : "Member";
    });

    return `Split: ${names.join(", ")} (${selectedCount})`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 bg-[#FFFFFF] dark:bg-[#1E1E1E] border border-amber-200 dark:border-amber-900/40 rounded-3xl shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(249, 185, 18, 0.2)" }}
            >
              <Mic className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                Voice to Expense
              </DialogTitle>
              <p className="text-[11px] text-gray-400 font-medium">
                Hands-free logging in Hindi, English & Hinglish
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Dancing Harmonic Soundwave Visualizer */}
        <div className="py-2.5 flex items-center justify-center gap-1 h-12 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => {
            const baseH = isListening
              ? 8 + Math.sin((i / 24) * Math.PI) * 22 * (0.6 + Math.random() * 0.4)
              : 5;
            return (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-150"
                style={{
                  height: `${baseH}px`,
                  background: isListening
                    ? "linear-gradient(to top, #F9B912, #D97706)"
                    : "#E2E8F0",
                }}
              />
            );
          })}
        </div>

        {/* Live Editable Transcript */}
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => handleTranscriptChange(e.target.value)}
            placeholder={
              isListening
                ? "Listening... speak now (e.g. 'Dinner 1200 split with Rahul')"
                : "Tap the microphone below to speak or edit text here..."
            }
            rows={2}
            className="w-full text-sm font-medium p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:border-amber-400 resize-none transition-all placeholder:text-gray-400"
          />
          {transcript.length > 0 && (
            <button
              type="button"
              onClick={() => handleTranscriptChange("")}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Voice Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-gray-400 shrink-0">Try:</span>
          {quickVoiceExamples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleTranscriptChange(ex)}
              className="text-[10.5px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium shrink-0 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-900 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* AI Loading State */}
        {isAiRefining && !parsed && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5">
            <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Understanding with Gemini AI...
            </span>
          </div>
        )}

        {/* Live Detected Expense Card */}
        {parsed && (
          <div
            className="p-3.5 rounded-2xl border transition-all"
            style={{
              background: "#FFFDF5",
              borderColor: hasAmount ? "#FDE68A" : "#FCA5A5",
            }}
          >
            {/* Header: Status + AI Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{
                    background: hasAmount ? "#D1FAE5" : "#FEE2E2",
                    color: hasAmount ? "#065F46" : "#991B1B",
                  }}
                >
                  {hasAmount ? <Check className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                  {hasAmount ? "Detected" : "Amount missing"}
                </span>

                {parsed.isAiEnhanced && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-blue-600" />
                    Gemini AI
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isAiRefining ? (
                  <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Refining...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => refineWithGemini(transcript, false)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                    AI Refine
                  </button>
                )}

                <span
                  className="text-[10.5px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: "#FEF3C7", color: "#D97706" }}
                >
                  {parsed.category}
                </span>
              </div>
            </div>

            {/* Title & Amount */}
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-base font-extrabold text-gray-900 truncate pr-2">
                {parsed.title}
              </span>
              <span
                className="text-xl font-black shrink-0"
                style={{ color: hasAmount ? "#D97706" : "#EF4444" }}
              >
                {hasAmount ? `${currencySymbol}${parsed.amount?.toLocaleString()}` : "No amount"}
              </span>
            </div>

            {/* Meta: Payer & Split Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-amber-100 text-[11px] text-gray-600">
              <span className="flex items-center gap-1 font-medium">
                <User className="h-3 w-3 text-gray-400" />
                Paid by <b className="text-gray-800">{parsed.payerName || "You"}</b>
              </span>

              <span className="flex items-center gap-1 font-semibold text-amber-800">
                <Users className="h-3 w-3 text-amber-600" />
                {getSplitSummary()}
              </span>
            </div>
          </div>
        )}

        {/* Feedback / Error */}
        {errorMsg && (
          <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            {successMsg}
          </div>
        )}

        {/* Action Buttons: Mic FAB + Log Primary Button */}
        <div className="flex items-center gap-3 pt-2">
          {/* Pulsing Mic FAB */}
          <button
            type="button"
            onClick={toggleListening}
            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer"
            style={{
              background: isListening
                ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : "linear-gradient(135deg, #F9B912, #FFB300)",
            }}
          >
            {isListening ? (
              <Square className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-slate-900" />
            )}
          </button>

          {/* Primary Save Button */}
          <Button
            type="button"
            disabled={isSubmitting || !hasAmount}
            onClick={handleSaveExpense}
            className="flex-1 h-12 rounded-2xl font-bold text-sm shadow-sm cursor-pointer"
            style={{
              background: hasAmount ? AMBER : "var(--muted)",
              color: hasAmount ? "#111827" : "var(--muted-foreground)",
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Log Expense <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          {/* Full Editor Option */}
          <button
            type="button"
            onClick={handleOpenFullEditor}
            title="Open in full split editor"
            className="h-12 w-12 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
