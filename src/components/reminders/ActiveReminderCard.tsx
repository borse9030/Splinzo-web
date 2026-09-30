"use client";

import React, { useState, useEffect } from "react";
import { Reminder } from "@/types/reminder";
import { reminderService } from "@/services/reminderService";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  Sparkles,
  Zap,
  Coffee,
  AlertTriangle,
} from "lucide-react";

interface ActiveReminderCardProps {
  reminder: Reminder;
  groupId: string;
  isCreditor?: boolean; // if current user is the one who set it
  onCancel?: () => void;
}

export const ActiveReminderCard: React.FC<ActiveReminderCardProps> = ({
  reminder,
  groupId,
  isCreditor = true,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState(
    reminderService.getCountdownDetails(reminder.dueAt, reminder.createdAt)
  );
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (reminder.status !== "active") return;

    const timer = setInterval(() => {
      setCountdown(
        reminderService.getCountdownDetails(reminder.dueAt, reminder.createdAt)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [reminder.dueAt, reminder.createdAt, reminder.status]);

  const handleCancelTimer = async () => {
    setIsCancelling(true);
    try {
      await reminderService.cancelReminder(groupId, reminder.id);
      if (onCancel) onCancel();
    } catch (err) {
      console.error("Failed to cancel reminder:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const isCompleted = reminder.status === "completed";
  const isCancelled = reminder.status === "cancelled";

  // Category Icon
  const getCategoryIcon = () => {
    switch (reminder.category) {
      case "friendly":
        return <Coffee className="h-3.5 w-3.5 text-emerald-600" />;
      case "urgent":
        return <Zap className="h-3.5 w-3.5 text-amber-600" />;
      case "deadline":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-blue-600" />;
    }
  };

  if (isCompleted) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Payment settled! Reminder timer automatically stopped.</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
          Stopped
        </span>
      </div>
    );
  }

  if (isCancelled) {
    return null;
  }

  return (
    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-300/80 shadow-2xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </div>
          {getCategoryIcon()}
          <span>Reminder Active:</span>
          <span className="font-mono text-amber-700 font-extrabold">
            {countdown.isExpired ? "Time Expired" : countdown.formatted}
          </span>
        </div>

        {isCreditor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelTimer}
            disabled={isCancelling}
            className="h-6 px-2 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
          >
            {isCancelling ? "Cancelling..." : "Cancel Timer"}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(countdown.progressPercent, 100)}%` }}
        />
      </div>

      {/* Message & Target Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
        <span className="truncate max-w-[280px] italic">
          &quot;{reminder.message}&quot;
        </span>
        <span className="font-bold text-slate-700 shrink-0 ml-2">
          {reminder.currency}{Number(reminder.amount).toFixed(2)}
        </span>
      </div>
    </div>
  );
};
