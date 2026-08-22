"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useInvitations } from "@/hooks/useInvitations";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { invitationService } from "@/services/invitationService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Check, X, Receipt, Users, Map, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function ActivityPage() {
  const { appUser } = useAuth();
  const { invitations, loading: invLoading } = useInvitations();
  const { feed, loading: feedLoading } = useActivityFeed();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleAccept = async (invitationId: string, groupId: string) => {
    if (!appUser) return;
    setProcessingId(invitationId);
    try {
      await invitationService.acceptInvitation(invitationId, groupId, appUser);
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await invitationService.declineInvitation(invitationId);
      setDeclinedIds(prev => new Set([...prev, invitationId]));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const visibleInvitations = invitations.filter(inv => !declinedIds.has(inv.id));
  const isLoading = invLoading || feedLoading;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'expense':
        return <Receipt className="h-5 w-5" style={{ color: AMBER }} />;
      case 'group':
        return <Users className="h-5 w-5" style={{ color: AMBER }} />;
      case 'trip':
        return <Map className="h-5 w-5" style={{ color: AMBER }} />;
      default:
        return <Inbox className="h-5 w-5" style={{ color: AMBER }} />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Activity</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Pending invitations and timeline</p>
        </header>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Activity</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Pending invitations and timeline</p>
        </div>
        {visibleInvitations.length > 0 && (
          <div
            className="h-8 px-3 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: AMBER, color: "#1a1a1a" }}
          >
            {visibleInvitations.length} Pending
          </div>
        )}
      </header>

      {/* ══ INVITATIONS SECTION ══ */}
      {visibleInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Inbox className="h-4 w-4" /> Invitations
          </h2>
          {visibleInvitations.map((invitation) => (
            <Card
              key={invitation.id}
              className="border-none shadow-sm rounded-2xl overflow-hidden bg-white"
            >
              <div className="h-1 w-full" style={{ background: AMBER }} />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shrink-0"
                    style={{ background: AMBER_LIGHT, color: AMBER }}
                  >
                    {invitation.groupName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-gray-900 text-base truncate">
                      {invitation.groupName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-700">{invitation.inviterName}</span>
                      {" "}invited you to join
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        disabled={processingId === invitation.id}
                        onClick={() => handleAccept(invitation.id, invitation.groupId)}
                        className="rounded-full px-5 font-bold text-sm h-9 hover:opacity-90"
                        style={{ background: AMBER, color: "#1a1a1a" }}
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        {processingId === invitation.id ? "Joining..." : "Accept"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === invitation.id}
                        onClick={() => handleDecline(invitation.id)}
                        className="rounded-full px-5 font-bold text-sm h-9 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ GLOBAL TIMELINE SECTION ══ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4" style={{ color: "#3B82F6" }} /> Global Timeline
        </h2>
        
        {feed.length === 0 ? (
          <Card className="border-dashed shadow-none rounded-3xl bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: AMBER_LIGHT }}
              >
                <Inbox className="h-8 w-8" style={{ color: AMBER }} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
              <p className="text-gray-500 mt-2 max-w-sm text-sm leading-relaxed">
                There is no recent activity in any of your groups.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {feed.map((activity) => (
              <Card key={activity.id} className="border-none shadow-sm rounded-2xl bg-gray-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: AMBER_LIGHT }}
                  >
                    {getIconForType(activity.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-gray-900 leading-tight">
                      <span className="font-bold">{activity.createdByName}</span> {activity.message}
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      {format(activity.createdAt, "MMM d, h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
