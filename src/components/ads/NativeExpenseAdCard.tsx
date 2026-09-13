"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ExternalLink, CreditCard, Gift, Compass } from "lucide-react";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";
const AMBER_DARK = "#F9A000";

interface NativeExpenseAdCardProps {
  adIndex?: number;
  className?: string;
}

const NATIVE_SPONSORS = [
  {
    title: "Split Dining with 5% Instant Cashback",
    badge: "5% Back",
    tag: "Dining Deal",
    icon: Sparkles,
    url: "https://splinzo.com",
    partner: "Splinzo Rewards",
  },
  {
    title: "Zero Forex Card for Group Trips",
    badge: "0% Markup",
    tag: "Travel Perk",
    icon: Compass,
    url: "https://splinzo.com",
    partner: "Splinzo Travel",
  },
  {
    title: "Instant Group Settlements via UPI",
    badge: "Zero Fees",
    tag: "Smart Banking",
    icon: CreditCard,
    url: "https://splinzo.com",
    partner: "Verified Partner",
  },
  {
    title: "Save 15% on Weekend Staycations & Villas",
    badge: "15% Off",
    tag: "Weekend Getaway",
    icon: Gift,
    url: "https://splinzo.com",
    partner: "Curated Deals",
  },
];

export function NativeExpenseAdCard({ adIndex = 0, className }: NativeExpenseAdCardProps) {
  const [clicked, setClicked] = useState(false);
  const sponsor = NATIVE_SPONSORS[adIndex % NATIVE_SPONSORS.length];
  const IconComponent = sponsor.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setClicked(true);
    setTimeout(() => setClicked(false), 800);
    window.open(sponsor.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`block ${className || ""}`}>
      <Card
        onClick={handleClick}
        className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden group relative"
        style={{
          background: "var(--card, #FFFFFF)",
          border: "1px solid rgba(249, 185, 18, 0.18)",
        }}
      >
        {/* Amber hover accent bar - identical to expense cards */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: `linear-gradient(180deg, ${AMBER}, ${AMBER_DARK})` }}
        />

        <CardContent className="p-4 flex items-center gap-4">
          {/* Sponsor Icon matching expense category icon container */}
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 overflow-hidden"
            style={{
              background: AMBER_LIGHT,
              border: "1px solid rgba(249, 185, 18, 0.25)",
            }}
          >
            <IconComponent className="h-6 w-6" style={{ color: AMBER_DARK }} />
          </div>

          {/* Info block matching expense card typography */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className="font-bold truncate text-sm sm:text-base text-gray-900 group-hover:text-amber-600 transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                {sponsor.title}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200/80 uppercase tracking-wider">
                Ad
              </span>
              <p
                className="text-[11px] sm:text-xs font-semibold truncate"
                style={{ color: "var(--muted-foreground)" }}
              >
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {sponsor.partner}
                </span>{" "}
                · {sponsor.tag}
              </p>
            </div>
          </div>

          {/* Action / Badge block matching amount and status pill */}
          <div className="text-right shrink-0 flex flex-col items-end justify-center">
            <p
              className="font-black text-sm sm:text-base tracking-tight mb-1 text-amber-600 dark:text-amber-400"
            >
              {sponsor.badge}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 inline-flex items-center gap-1 group-hover:bg-amber-100 transition-colors"
            >
              Sponsored
              <ExternalLink className="h-2.5 w-2.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
