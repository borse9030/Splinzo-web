import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Splinzo",
  description: "Get in touch with the Splinzo team. We're here to help with any questions about our smart expense sharing app.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
