"use client";

import { AdUnit } from "./AdUnit";

interface ArticleAdProps {
  className?: string;
}

/**
 * In-article responsive display ad for blog posts.
 *
 * Placement: After the first major content section and at the end of the article.
 * Max 2 per article to comply with Google's Better Ads Standards.
 *
 * TODO: Replace YYYYYYYYYY with your real in-article ad slot ID from AdSense:
 *   Ads → By ad unit → Create new ad unit → In-article
 */
export function ArticleAd({ className }: ArticleAdProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        margin: "32px 0",
        padding: "0",
        borderTop: "1px solid #F3F4F6",
        borderBottom: "1px solid #F3F4F6",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: 10,
          fontWeight: 600,
          color: "#D1D5DB",
          letterSpacing: "1px",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        Advertisement
      </p>
      <AdUnit
        slot="YYYYYYYYYY" // TODO: replace with real in-article slot ID
        format="auto"
        fullWidthResponsive={true}
        style={{ minHeight: 90 }}
      />
    </div>
  );
}
