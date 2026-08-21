import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | Splinzo",
  description: "Create a free Splinzo account today. The smartest way to split expenses with friends, roommates, and groups.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
