"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { reminderService } from "@/services/reminderService";
import { ReminderCategory, RepeatInterval } from "@/types/reminder";
import {
  Clock,
  Bell,
  Sparkles,
  Zap,
  Coffee,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  currency?: string;
  onReminderCreated?: (reminderId: string) => void;
}

interface MessagePreset {
  id: ReminderCategory;
  label: string;
  icon: any;
  color: string;
  bgActive: string;
  borderActive: string;
  message: string;
}

const PRESETS: MessagePreset[] = [
  {
    id: "friendly",
    label: "Friendly",
    icon: Coffee,
    color: "text-emerald-700",
    bgActive: "bg-emerald-50 border-emerald-300 text-emerald-900",
    borderActive: "border-emerald-500",
    message: "Hey! Just a gentle reminder to settle your share whenever you get a chance.",
  },
  {
    id: "urgent",
    label: "Urgent",
    icon: Zap,
    color: "text-amber-700",
    bgActive: "bg-amber-50 border-amber-300 text-amber-900",
    borderActive: "border-amber-500",
    message: "Urgent: Need this cleared today for group bills, please settle up soon!",
  },
  {
    id: "casual",
    label: "Casual",
    icon: Sparkles,
    color: "text-blue-700",
    bgActive: "bg-blue-50 border-blue-300 text-blue-900",
    borderActive: "border-blue-500",
    message: "Hey friend, don't forget to settle our group split from the other day!",
  },
  {
    id: "deadline",
    label: "Strict",
    icon: AlertTriangle,
    color: "text-rose-700",
    bgActive: "bg-rose-50 border-rose-300 text-rose-900",
    borderActive: "border-rose-500",
    message: "Payment is due according to the group schedule. Please transfer at your earliest.",
  },
];

const TIMER_OPTIONS = [
  { hours: 1, label: "1 Hour" },
  { hours: 6, label: "6 Hours" },
  { hours: 12, label: "12 Hours" },
  { hours: 24, label: "24 Hours (1 Day)" },
  { hours: 48, label: "2 Days" },
  { hours: 72, label: "3 Days" },
  { hours: -1, label: "Custom" },
];

export const SetReminderModal: React.FC<SetReminderModalProps> = ({
  isOpen,
  onClose,
  groupId,
  fromUserId,
  fromUserName,
  toUserId,
  toUserName,
  amount,
  currency = "₹",
  onReminderCreated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory>("friendly");
  const [customMessage, setCustomMessage] = useState(PRESETS[0].message);
  const [selectedTimerHours, setSelectedTimerHours] = useState<number>(24);
  const [customDate, setCustomDate] = useState<string>("");
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSelectPreset = (preset: MessagePreset) => {
    setSelectedCategory(preset.id);
    setCustomMessage(preset.message);
  };

  const calculateTargetTimeText = () => {
    if (selectedTimerHours === -1 && customDate) {
      const d = new Date(customDate);
      return isNaN(d.getTime()) ? "" : `Due ${d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    }
    const d = new Date(Date.now() + selectedTimerHours * 60 * 60 * 1000);
    return `Ends ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${selectedTimerHours >= 24 ? `${Math.round(selectedTimerHours / 24)}d later` : "today"})`;
  };

  const handleStartTimer = async () => {
    if (!customMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const reminderId = await reminderService.createReminder({
        groupId,
        fromUserId,
        fromUserName,
        toUserId,
        toUserName,
        amount,
        currency,
        formData: {
          message: customMessage.trim(),
          category: selectedCategory,
          timerDurationHours: selectedTimerHours === -1 ? 24 : selectedTimerHours,
          customDueDate: selectedTimerHours === -1 ? customDate : undefined,
          repeatInterval,
        },
      });

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccess(false);
        if (onReminderCreated) onReminderCreated(reminderId);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to start reminder timer:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-slate-200/80 shadow-2xl bg-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 p-5 text-white relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Set Custom Reminder & Timer
              </DialogTitle>
              <DialogDescription className="text-amber-100 text-xs font-medium mt-0.5">
                For {fromUserName} • {currency}{amount.toFixed(2)} pending
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Preset Tone Selector */}
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
              1. Choose Tone Preset
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedCategory === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? `${preset.bgActive} shadow-xs border-current font-extrabold ring-1 ring-current`
                        : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1 ${preset.color}`} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
                2. Custom Message Note
              </Label>
              <span className="text-[11px] text-slate-400 font-medium">
                {customMessage.length}/180
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={180}
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                if (selectedCategory !== "custom") setSelectedCategory("custom");
              }}
              placeholder="Write a custom note to the payer..."
              className="w-full text-sm font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50/50 resize-none"
            />
          </div>

          {/* Timer & Due Date Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                3. Countdown Timer Duration
              </Label>
              <span className="text-xs font-bold text-amber-600">
                {calculateTargetTimeText()}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {TIMER_OPTIONS.map((opt) => {
                const isSelected = selectedTimerHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setSelectedTimerHours(opt.hours)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 border-amber-600 text-white shadow-xs font-black"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {selectedTimerHours === -1 && (
              <div className="mt-2.5">
                <Label className="text-[11px] text-slate-500 mb-1 block">Pick exact deadline date & time:</Label>
                <Input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            )}
          </div>

          {/* Repeat Interval */}
          <div>
            <Label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
              4. Reminder Frequency
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "none", label: "One-time" },
                { id: "every_12h", label: "Every 12h" },
                { id: "daily", label: "Daily" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRepeatInterval(item.id as RepeatInterval)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    repeatInterval === item.id
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold ring-1 ring-indigo-400"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <Bell className="h-3 w-3" /> Payer View Preview
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Live Banner
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
              &quot;{customMessage}&quot;
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-amber-200/50 pt-1.5">
              <span>Amount: <strong className="text-slate-800">{currency}{amount.toFixed(2)}</strong></span>
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" /> {calculateTargetTimeText()}
              </span>
            </div>
          </div>

          {/* Auto-Stop Guarantee info note */}
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Auto-Stop Guarantee: </span>
              As soon as {fromUserName} completes this payment, this reminder and active timer will instantly and automatically stop.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl h-10 px-4 font-bold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartTimer}
            disabled={isSubmitting || !customMessage.trim()}
            className="rounded-xl h-10 px-5 font-black bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white shadow-md hover:opacity-95 cursor-pointer flex items-center gap-2"
          >
            {success ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-white animate-bounce" />
                Timer Activated!
              </>
            ) : isSubmitting ? (
              "Activating Timer..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Start Reminder Timer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
