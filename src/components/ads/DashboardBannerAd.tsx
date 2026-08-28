"use client";

import { AdUnit } from "./AdUnit";

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
 * TODO: Replace ZZZZZZZZZ with your real display/leaderboard slot ID from AdSense:
 *   Ads → By ad unit → Create new ad unit → Display ads (horizontal format)
 */
export function DashboardBannerAd({ className }: DashboardBannerAdProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 0 16px 0",
        position: "relative",
      }}
    >
      {/* Subtle label */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "#D1D5DB",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        Ad
      </span>
      <div
        style={{
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          background: "white",
          border: "1px solid #F3F4F6",
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
          minHeight: 90,
        }}
      >
        <AdUnit
          slot="ZZZZZZZZZ" // TODO: replace with real display slot ID
          format="horizontal"
          fullWidthResponsive={true}
        />
      </div>
    </div>
  );
}
