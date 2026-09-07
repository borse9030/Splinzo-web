"use client";

import { Navigation } from "@/components/layout/Navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F9F7F2" }}>
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
