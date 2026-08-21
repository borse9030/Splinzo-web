import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Splinzo",
  description: "Read the Splinzo Terms of Service. Guidelines and rules for using our expense sharing platform.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
