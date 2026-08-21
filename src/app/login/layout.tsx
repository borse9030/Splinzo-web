import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | Splinzo",
  description: "Log in to your Splinzo account to track expenses, manage groups, and settle up with friends.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
