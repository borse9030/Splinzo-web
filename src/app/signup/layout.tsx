import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Join Splinzo Free",
  description: "Create your free Splinzo account today. Start splitting expenses with friends, roommates, and group trips effortlessly.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
