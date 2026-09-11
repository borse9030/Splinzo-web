"use client";

import { AdsterraBanner } from "./AdsterraBanner";

interface InFeedAdProps {
  className?: string;
}

/**
 * In-feed native ad styled to blend seamlessly with Splinzo blog cards.
 * Placement: Injected between cards in blog feed.
 * Powered by Adsterra
 */
export function InFeedAd({ className }: InFeedAdProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        background: "var(--card, #FFFFFF)",
        borderRadius: "24px",
        border: "1px solid var(--border, #F1F5F9)",
        boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 12px",
        minHeight: 180,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 14,
          fontSize: 9,
          fontWeight: 800,
          color: "#94A3B8",
          letterSpacing: "0.5px",
          background: "var(--muted, #F8FAFC)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 6,
          padding: "2px 6px",
          textTransform: "uppercase",
          zIndex: 10,
        }}
      >
        Sponsored
      </div>

      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <AdsterraBanner
          adKey="ae9d16cc9abc184e693997fd2e0102fb"
          width={728}
          height={90}
        />
      </div>
    </div>
  );
}
