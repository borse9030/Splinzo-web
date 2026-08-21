"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// List of paths where ads should NOT be shown
const restrictedPaths = ["/", "/login", "/signup", "/contact", "/terms", "/privacy-policy", "/blog"];

export function MonetagAd() {
  const pathname = usePathname();

  // Check if current path matches or starts with any restricted path
  // Be careful not to block '/groups' just because it starts with '/'
  // We use exact match for '/', and startsWith for others like '/login'
  const isRestricted = restrictedPaths.some((restrictedPath) => {
    if (restrictedPath === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(restrictedPath);
  });

  if (isRestricted) {
    return null;
  }

  return (
    <>
      {/* Vignette Banner */}
      <Script
        src="https://n6wxm.com/vignette.min.js"
        data-zone="11624127"
        strategy="afterInteractive"
      />
      {/* In-Page Push Banner */}
      <Script
        src="https://nap5k.com/tag.min.js"
        data-zone="11624187"
        strategy="afterInteractive"
      />
    </>
  );
}
