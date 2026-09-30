"use client";

import React, { useState, useEffect } from "react";
import { Reminder } from "@/types/reminder";
import { reminderService } from "@/services/reminderService";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface DebtorReminderAlertProps {
  reminders: Reminder[];
  onSettleClick?: (reminder: Reminder) => void;
}

export const DebtorReminderAlert: React.FC<DebtorReminderAlertProps> = ({
  reminders,
  onSettleClick,
}) => {
  const activeReminders = reminders.filter((r) => r.status === "active");

  if (activeReminders.length === 0) return null;

  return (
    <div className="space-y-2.5 my-4">
      {activeReminders.map((reminder) => (
        <DebtorReminderItem
          key={reminder.id}
          reminder={reminder}
          onSettleClick={onSettleClick}
        />
      ))}
    </div>
  );
};

const DebtorReminderItem: React.FC<{
  reminder: Reminder;
  onSettleClick?: (reminder: Reminder) => void;
}> = ({ reminder, onSettleClick }) => {
  const [countdown, setCountdown] = useState(
    reminderService.getCountdownDetails(reminder.dueAt, reminder.createdAt)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(
        reminderService.getCountdownDetails(reminder.dueAt, reminder.createdAt)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [reminder.dueAt, reminder.createdAt]);

  const isUrgent = countdown.totalSecondsLeft < 7200 || countdown.isExpired;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 transition-all shadow-md ${
        isUrgent
          ? "border-rose-300 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 text-rose-950 ring-1 ring-rose-200"
          : "border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/60 to-yellow-50/50 text-amber-950"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isUrgent
                ? "bg-rose-500 text-white"
                : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
            }`}
          >
            {isUrgent ? (
              <AlertCircle className="h-5 w-5 animate-pulse" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current text-[10px]">
                Payment Reminder
              </span>
              <span className="text-xs font-bold text-slate-700">
                From <strong className="text-slate-900">{reminder.toUserName}</strong>
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800 italic">
              &quot;{reminder.message}&quot;
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
              <span>
                Amount: <strong className="font-extrabold text-slate-900">{reminder.currency}{Number(reminder.amount).toFixed(2)}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono font-bold text-amber-800">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                {countdown.isExpired ? (
                  <span className="text-rose-600 font-black">Timer Expired</span>
                ) : (
                  <span>Due in {countdown.formatted}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0">
          {onSettleClick && (
            <Button
              onClick={() => onSettleClick(reminder)}
              size="sm"
              className={`rounded-xl h-9.5 px-4 font-black shadow-xs cursor-pointer flex items-center gap-1.5 ${
                isUrgent
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              Pay Now {reminder.currency}{Number(reminder.amount).toFixed(2)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Timer auto-stops upon payment
          </span>
        </div>
      </div>
    </div>
  );
};
