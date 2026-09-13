"use client";

import { AdsterraBanner } from "./AdsterraBanner";

interface NativeExpenseAdCardProps {
  adIndex?: number;
  className?: string;
}

/**
 * In-feed native advertisement card interleaved inside the expenses section.
 * Renders real ad network banners (Adsterra) inside the clean, rounded card
 * container with a discreet "Sponsored" indicator.
 */
export function NativeExpenseAdCard({ className }: NativeExpenseAdCardProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        position: "relative",
        margin: "6px 0",
      }}
    >
      {/* Subtle sponsored label matching Image 2 */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        Sponsored
      </span>

      {/* Clean card container matching expense cards */}
      <div
        className="rounded-2xl transition-all hover:shadow-md overflow-hidden"
        style={{
          width: "100%",
          background: "var(--card, #FFFFFF)",
          border: "1px solid var(--border, #E5E7EB)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
          minHeight: 92,
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
