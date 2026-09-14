import React from "react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.splinzo.in";

/**
 * Global Organization & WebSite Schema
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        "name": "Splinzo",
        "url": BASE_URL,
        "logo": {
          "@type": "ImageObject",
          "@id": `${BASE_URL}/#logo`,
          "url": `${BASE_URL}/logo.png`,
          "caption": "Splinzo Logo"
        },
        "description": "The smartest way to split expenses with friends, roommates, and groups. Fast, fair, and seamless bill splitting.",
        "sameAs": [
          "https://play.google.com/apps/testing/com.splinzo.splinzo"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        "url": BASE_URL,
        "name": "Splinzo",
        "publisher": {
          "@id": `${BASE_URL}/#organization`
        },
        "description": "Smart Expense Sharing & Group Bill Splitter"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Web Application Schema for Splinzo
 */
export function WebApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Splinzo",
    "url": BASE_URL,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Android, Web, iOS",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Split expenses with friends, roommates, and groups with automatic zero-sum calculations and direct UPI settlements.",
    "featureList": [
      "Automated zero-sum debt simplification",
      "Seamless UPI settlement deeplinks",
      "Offline-first local expense logging",
      "Multi-currency conversion & tracking",
      "In-group real-time chat & expense notes",
      "Multi-user instant sync across devices"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ Schema markup for rich snippet display in Google Search
 */
export function FaqSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Blog Posting Schema for /blog/[slug]
 */
export function BlogArticleSchema({
  title,
  summary,
  date,
  author,
  slug,
  imageUrl,
}: {
  title: string;
  summary: string;
  date: string;
  author: string;
  slug: string;
  imageUrl?: string;
}) {
  const postUrl = `${BASE_URL}/blog/${slug}`;
  const image = imageUrl || `${BASE_URL}/opengraph-image.png`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": summary,
    "url": postUrl,
    "datePublished": new Date(date).toISOString(),
    "dateModified": new Date(date).toISOString(),
    "image": image,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Splinzo",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Breadcrumb Schema for search engine navigation snippets
 */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
