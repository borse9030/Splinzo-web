import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Resources | Splinzo",
  description: "Read the latest tips, guides, and resources on managing group expenses, traveling with friends, and splitting bills effortlessly.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
