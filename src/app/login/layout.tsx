import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your Splinzo account to manage groups, track shared expenses, and settle balances.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
