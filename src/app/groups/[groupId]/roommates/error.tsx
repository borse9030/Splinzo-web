"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function FlatHQError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Flat HQ page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
        Unable to load Flat HQ
      </h2>
      <p className="text-xs text-gray-500 max-w-sm mt-1.5 mb-6">
        We encountered a momentary glitch while syncing your flat duties. Tap below to reload.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="rounded-2xl font-bold text-xs gap-2 shadow-md cursor-pointer"
          style={{ background: "#F9B912", color: "#1a1a1a" }}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Reload Flat HQ
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-2xl font-bold text-xs gap-2 cursor-pointer"
        >
          <Link href="/dashboard">
            <Home className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
