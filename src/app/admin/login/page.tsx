"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Secret admin login must ONLY happen through the main /login page
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>
  );
}
