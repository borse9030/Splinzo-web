import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Splinzo",
  description: "Read the Splinzo Privacy Policy. Learn how we protect your personal and financial data.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
