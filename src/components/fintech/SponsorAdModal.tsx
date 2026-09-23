"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  Gift,
  AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";

interface SponsorAdModalProps {
  open: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  settleAmount: number;
  receiverName: string;
  durationSeconds?: number;
}

export default function SponsorAdModal({
  open,
  onClose,
  onRewardEarned,
  settleAmount,
  receiverName,
  durationSeconds = 15, // Balanced 15-second duration to generate required ad revenue
}: SponsorAdModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [rewardReady, setRewardReady] = useState(false);
  const [adBlocked, setAdBlocked] = useState(false);

  useEffect(() => {
    if (!open) {
      setSecondsRemaining(durationSeconds);
      setRewardReady(false);
      setAdBlocked(false);
      return;
    }

    setSecondsRemaining(durationSeconds);
    setRewardReady(false);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRewardReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, durationSeconds]);

  const handleClaim = () => {
    onRewardEarned();
  };

  const progressPercent = Math.min(
    100,
    Math.round(((durationSeconds - secondsRemaining) / durationSeconds) * 100)
  );

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && rewardReady) {
        handleClaim();
      } else if (!val) {
        onClose();
      }
    }}>
      <DialogContent 
        className="w-[calc(100%-1.25rem)] sm:max-w-lg p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-slate-950 text-white [&>button]:hidden focus:outline-none"
      >
        <DialogTitle className="sr-only">Sponsored Ad - Free Settlement</DialogTitle>
        <DialogDescription className="sr-only">
          Watch this official sponsor advertisement to waive the platform fee and settle for free.
        </DialogDescription>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
              Official Sponsored Ad
            </span>
            <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              ₹1.00 Waived
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-xs font-semibold px-2 py-1 rounded-lg hover:bg-white/10 flex items-center gap-1 cursor-pointer"
              title="Close Ad"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Ad Container (Adsterra Display Unit) */}
        <div className="p-4 sm:p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[300px] relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Ad Provider Label */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Adsterra Verified Network
            </span>
            <span className="font-mono text-slate-500 text-[10px]">
              ID: ae9d16cc...
            </span>
          </div>

          {/* Adsterra Banner Container */}
          <div className="w-full rounded-2xl bg-slate-950/80 border border-white/10 p-2 sm:p-3 flex flex-col items-center justify-center shadow-inner overflow-hidden min-h-[220px]">
            <AdsterraBanner
              adKey="ae9d16cc9abc184e693997fd2e0102fb"
              width={300}
              height={250}
              className="mx-auto"
            />
          </div>

          {/* Fallback & Safety Notice */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mt-2.5 px-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Guaranteed Zero Platform Fee on Completion
            </span>
            <span className="text-[10px] text-slate-500">
              {rewardReady ? "Ready to Claim" : `${secondsRemaining}s required`}
            </span>
          </div>

        </div>

        {/* Live Progress Bar */}
        <div className="w-full bg-slate-800 h-2 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-green-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Reward Benefit Callout & Action Bar */}
        <div className="p-5 sm:p-6 bg-slate-900 space-y-4">
          
          {/* Benefit Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Platform Fee: <span className="line-through text-slate-400 mr-1.5">₹1.00</span>
                  <span className="text-emerald-400 font-extrabold">₹0.00 (100% FREE)</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Pay exact ₹{settleAmount.toFixed(2)} to {receiverName} without gateway charges
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 shrink-0">
              100% Free
            </span>
          </div>

          {/* Action Trigger */}
          {rewardReady ? (
            <Button
              onClick={handleClaim}
              className="w-full h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm sm:text-base shadow-xl hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-5 w-5" />
              Claim Reward & Settle ₹{settleAmount.toFixed(2)} Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold cursor-pointer"
              >
                Skip & Use Instant (+₹1 Fee)
              </Button>

              <div className="text-center sm:text-right">
                <span className="text-xs text-slate-300 font-medium">
                  Watching sponsor ad... <strong className="text-amber-300 font-bold">{secondsRemaining}s remaining</strong>
                </span>
              </div>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
