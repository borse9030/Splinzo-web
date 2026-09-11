"use client";

import { AdsterraBanner } from "./AdsterraBanner";

interface ArticleAdProps {
  className?: string;
}

/**
 * In-article responsive display ad for blog posts.
 * Placement: After the first major content section and at the end of the article.
 * Powered by Adsterra
 */
export function ArticleAd({ className }: ArticleAdProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        margin: "32px 0",
        padding: "16px 0",
        borderTop: "1px solid var(--border, #F1F5F9)",
        borderBottom: "1px solid var(--border, #F1F5F9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <p
        style={{
          textAlign: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "#94A3B8",
          letterSpacing: "1px",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        Advertisement
      </p>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
