"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
  /** AdSense ad slot ID (numeric string from AdSense dashboard) */
  slot: string;
  /** Ad format. "auto" for responsive, "horizontal" for leaderboard */
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  /** Optional inline style overrides */
  style?: React.CSSProperties;
  /** Optional class name */
  className?: string;
  /** Whether the ad is full-width responsive */
  fullWidthResponsive?: boolean;
}

/**
 * Core AdSense display unit for the Splinzo website.
 *
 * Features:
 * - SSR-safe: only pushes to adsbygoogle after mount
 * - Gracefully handles ad-blocker (empty div collapses)
 * - Re-initializes correctly when navigating between pages
 * - Each instance has a unique key-driven re-mount
 */
export function AdUnit({
  slot,
  format = "auto",
  style,
  className,
  fullWidthResponsive = true,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;

    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
      }
    } catch (e) {
      // Ad-blocker or script not yet loaded — silently ignore
    }
  }, []);

  return (
    <div className={className} style={{ overflow: "hidden", ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9758730673684519"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
