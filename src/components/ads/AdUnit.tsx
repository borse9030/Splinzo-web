"use client";

import { useEffect, useRef, useState } from "react";

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
 * - SSR-safe: only pushes to adsbygoogle after mount and measurable width (> 0)
 * - Prevents "TagError: adsbygoogle.push() error: No slot size for availableWidth=0"
 * - Validates slot ID (avoids pushing dummy placeholder slots like ZZZZZZZZZ)
 * - Uses ResizeObserver to wait until container width is available before push
 * - Gracefully handles ad-blocker (empty div collapses)
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
  const isRealSlot = Boolean(slot && /^\d+$/.test(slot.trim()));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || pushed.current) return;

    // Do not call adsbygoogle.push for placeholder or non-numeric slots
    if (!isRealSlot) return;

    const element = adRef.current;
    if (!element) return;

    const tryPush = () => {
      if (pushed.current) return;
      const width = element.offsetWidth || element.clientWidth || element.parentElement?.clientWidth || 0;
      if (width > 0) {
        pushed.current = true;
        try {
          const adsbygoogle = (window as any).adsbygoogle;
          if (adsbygoogle) {
            adsbygoogle.push({});
          }
        } catch {
          // Silently handle ad-blockers or script errors
        }
      }
    };

    // If container already has width, push immediately
    if ((element.offsetWidth || element.clientWidth) > 0) {
      tryPush();
      return;
    }

    // Wait until element has measurable width (> 0) to avoid "availableWidth=0" error
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            tryPush();
            observer.disconnect();
            break;
          }
        }
      });
      observer.observe(element);
      if (element.parentElement) {
        observer.observe(element.parentElement);
      }
      return () => {
        observer.disconnect();
      };
    } else {
      const timer = setTimeout(tryPush, 300);
      return () => clearTimeout(timer);
    }
  }, [isMounted, isRealSlot]);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        minWidth: "250px",
        overflow: "hidden",
        ...style,
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minWidth: "250px" }}
        data-ad-client="ca-pub-9758730673684519"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
