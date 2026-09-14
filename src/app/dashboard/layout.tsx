"use client";

import { Navigation } from "@/components/layout/Navigation";
import { StickyBottomAd } from "@/components/ads/StickyBottomAd";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 pb-28 md:pb-20">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Floating Viewable Bottom Ad Unit */}
      <StickyBottomAd />
    </div>
  );
}
