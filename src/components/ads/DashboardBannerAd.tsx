"use client";

import { AdsterraBanner } from "./AdsterraBanner";

interface DashboardBannerAdProps {
  className?: string;
}

/**
 * Leaderboard / horizontal responsive ad for dashboard pages.
 *
 * Placement: Below the page header, above the main content list.
 * Styled subtly so it blends with dashboard cards without disrupting
 * any active task flow.
 *
 * Powered by Adsterra 728x90 Leaderboard Unit
 */
export function DashboardBannerAd({ className }: DashboardBannerAdProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        margin: "0 0 16px 0",
        position: "relative",
      }}
    >
      {/* Subtle label */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        Sponsored
      </span>
      <div
        style={{
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--card, #FFFFFF)",
          border: "1px solid var(--border, #F1F5F9)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
          minHeight: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 0",
        }}
      >
        <AdsterraBanner
          adKey="ae9d16cc9abc184e693997fd2e0102fb"
          width={728}
          height={90}
        />
      </div>
    </div>
  );
}
