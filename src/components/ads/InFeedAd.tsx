"use client";

import { AdUnit } from "./AdUnit";

interface InFeedAdProps {
  className?: string;
}

/**
 * In-feed native ad styled to blend seamlessly with Splinzo blog cards.
 *
 * Placement: inject every N items in a list/grid (e.g. after card 3 in blog).
 * Uses a dedicated in-feed ad slot for better Google optimization.
 *
 * TODO: Replace XXXXXXXXXX with your real in-feed ad slot ID from AdSense:
 *   Ads → By ad unit → Create new ad unit → In-feed
 */
export function InFeedAd({ className }: InFeedAdProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        background: "white",
        borderRadius: "24px",
        border: "1px solid #F3F4F6",
        boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Policy-required "Ad" label */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          fontSize: 9,
          fontWeight: 700,
          color: "#9CA3AF",
          letterSpacing: "0.5px",
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 4,
          padding: "1px 5px",
          zIndex: 10,
        }}
      >
        Ad
      </div>
      <AdUnit
        slot="XXXXXXXXXX" // TODO: replace with real in-feed slot ID
        format="auto"
        style={{ minHeight: 200 }}
        fullWidthResponsive={true}
      />
    </div>
  );
}
