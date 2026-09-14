import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Split Expenses, Roommate Budgeting & Travel Guides",
  description: "Read practical guides and expert tips on splitting rent with roommates, planning group trips, managing shared budgets, and reducing financial friction.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Splinzo Blog — Group Expense Sharing & Budgeting Guides",
    description: "Read practical guides and expert tips on splitting rent with roommates, planning group trips, and managing shared finances.",
    url: "/blog",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Splinzo Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Splinzo Blog — Group Expense Sharing & Budgeting Guides",
    description: "Practical guides and tips on splitting rent, trip budgets, and shared expenses.",
    images: ["/opengraph-image.png"],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
