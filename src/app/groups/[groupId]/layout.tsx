"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGroup } from "@/hooks/useGroup";
import { ChevronLeft, Camera, Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/layout/Navigation";
import { cn } from "@/lib/utils";
import { useCall } from "@/contexts/CallContext";

const AMBER = "#F9B912";

export default function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { group, loading, error } = useGroup(resolvedParams.groupId);
  const { startCall } = useCall();
  const pathname = usePathname();

  const tabs = [
    { name: "Expenses", href: `/groups/${resolvedParams.groupId}` },
    { name: "Chat", href: `/groups/${resolvedParams.groupId}/chat` },
    { name: "Members", href: `/groups/${resolvedParams.groupId}/members` },
    { name: "Trips", href: `/groups/${resolvedParams.groupId}/trips` },
  ];

  if (error) {
    return (
      <div className="flex h-[100dvh] overflow-hidden" style={{ background: "#F7F7F7" }}>
        <Navigation />
        <main className="flex-1 w-full md:ml-64 pb-20 md:pb-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 font-bold text-2xl">!</span>
            </div>
            <h2 className="text-2xl font-bold">Group not found</h2>
            <p className="text-gray-500 mt-2 mb-6">
              The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
            </p>
            <Button asChild className="rounded-full" style={{ background: AMBER, color: "#1a1a1a" }}>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: "#F7F7F7" }}>
      {/* Shared sidebar + mobile nav */}
      <Navigation />

      {/* Group content — offset for sidebar on desktop */}
      <main className="flex flex-col flex-1 w-full md:ml-64 pb-20 md:pb-0 overflow-x-hidden" style={{ minHeight: 0 }}>

        {/* Group Hero Banner — matches app's Goa screen */}
        <div className="relative w-full" style={{ height: "160px" }}>
          {group?.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={group?.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{ background: "linear-gradient(135deg, #F9B912 0%, #FFB300 50%, #FF8F00 100%)" }}
            />
          )}

          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" }}
          />

          {/* Top row: back arrow + group name + camera */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <Link href="/dashboard">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </div>
            </Link>
            {loading ? (
              <Skeleton className="h-5 w-24 bg-white/30" />
            ) : (
              <span className="text-white font-semibold text-base">{group?.name}</span>
            )}
            <button
              onClick={() => {
                if (group) {
                  startCall(group.id, group.name);
                }
              }}
              className="h-9 w-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Bottom of banner: group name + total */}
          <div className="absolute bottom-4 left-4">
            {loading ? (
              <div className="space-y-1">
                <Skeleton className="h-6 w-24 bg-white/30" />
                <Skeleton className="h-4 w-36 bg-white/30" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{group?.name}</h1>
                <p className="text-white/80 text-sm font-medium">▣ Total: INR 0.00</p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!loading && (
          <div className="flex gap-3 px-4 pt-4 pb-0 bg-white">
            <Button
              asChild
              className="flex-1 rounded-full h-12 font-bold text-base shadow-md"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Link href={`/groups/${resolvedParams.groupId}/expenses/new`}>
                <Plus className="h-5 w-5 mr-2" />
                Add Expense
              </Link>
            </Button>
            <Button
              asChild
              className="flex-1 rounded-full h-12 font-bold text-base border-2"
              style={{ background: "transparent", color: "#1a1a1a", borderColor: "#1a1a1a" }}
            >
              <Link href={`/groups/${resolvedParams.groupId}/settle`}>
                <Scale className="h-4 w-4 mr-2" />
                Settle Up
              </Link>
            </Button>
          </div>
        )}

        {/* Tab Bar */}
        {!loading && (
          <div
            className="bg-white border-b flex overflow-x-auto hide-scrollbar px-4"
            style={{ borderColor: "#F0F0F0" }}
          >
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    "whitespace-nowrap py-3 px-4 font-semibold text-sm transition-all border-b-2 shrink-0",
                    !isActive && "text-gray-400 border-transparent hover:text-gray-700"
                  )}
                  style={isActive ? { color: AMBER, borderColor: AMBER } : {}}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-h-0" style={{ background: "#F7F7F7" }}>
          <div className="flex flex-col flex-1 min-h-0 w-full max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-4 pt-4 px-4 sm:px-6 lg:px-8">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : pathname.includes("/chat") ? (
              /* Chat tab: no padding, fills full height */
              children
            ) : (
              /* All other tabs: padded + scrollable */
              <div className="px-4 sm:px-6 lg:px-8 py-4 pb-28 overflow-y-auto">
                {children}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
