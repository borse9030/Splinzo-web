"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/useGroups";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, LogIn } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardBannerAd } from "@/components/ads/DashboardBannerAd";
import { JoinGroupDialog } from "@/components/groups/JoinGroupDialog";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function DashboardGroupsPage() {
  const { appUser } = useAuth();
  const { groups, loading, error } = useGroups();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Groups</h1>
          <p className="text-sm font-medium text-gray-500">
            All the groups you are a part of
          </p>
        </div>
      </header>

      {/* Ad between header and content */}
      <DashboardBannerAd />

      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5">
          <Button
            type="button"
            onClick={() => setJoinDialogOpen(true)}
            className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-sm border border-gray-200 bg-white text-gray-800 hover:border-amber-400 hover:text-amber-700 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogIn className="h-4 w-4 mr-1 text-blue-600 shrink-0" />
            <span>Join Group</span>
          </Button>
          <Button
            asChild
            className="flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: `linear-gradient(135deg, ${AMBER} 0%, #F9A000 100%)`,
              color: "#1a1a1a",
              border: "none",
            }}
          >
            <Link href="/groups/new">
              <Plus className="h-4 w-4 mr-1 shrink-0" />
              <span>New Group</span>
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
            Failed to load groups. Please try again.
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-none shadow-sm rounded-2xl">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-dashed shadow-none rounded-3xl" style={{ background: "#FAFAFA" }}>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: AMBER_LIGHT }}
              >
                <UsersIcon className="h-8 w-8" style={{ color: AMBER }} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Your Splinzo journey starts here</h3>
              <p className="text-gray-500 mt-2 mb-6 max-w-sm text-sm leading-relaxed">
                Create your first group and start splitting expenses with friends, family, or roommates.
              </p>
              <Button
                asChild
                className="rounded-full px-6 font-bold"
                style={{ background: AMBER, color: "#1a1a1a" }}
              >
                <Link href="/groups/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Group
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="block">
                <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {group.imageUrl ? (
                        <img
                          src={group.imageUrl}
                          alt={group.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      ) : (
                        <div
                          className="h-14 w-14 rounded-2xl flex items-center justify-center font-extrabold text-xl"
                          style={{ background: AMBER_LIGHT, color: AMBER }}
                        >
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate font-medium">
                          {group.members?.length || 0} members · {group.type || "Friends"}
                        </p>
                        <div className="flex gap-1 mt-1.5">
                          {(group.members || []).slice(0, 3).map((_: unknown, i: number) => (
                            <div
                              key={i}
                              className="h-5 w-5 rounded-full flex items-center justify-center"
                              style={{ background: AMBER_LIGHT }}
                            >
                              <UserDotIcon className="h-3 w-3" style={{ color: AMBER }} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <JoinGroupDialog
        isOpen={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
      />
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserDotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v1h20v-1c0-3.3-6.7-5-10-5z" />
    </svg>
  );
}
