"use client";

import { Navigation } from "@/components/layout/Navigation";
import Script from "next/script";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F9F7F2" }}>
      {/* AdSense loads ONLY here — after login, only for dashboard pages */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9758730673684519"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-64 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
