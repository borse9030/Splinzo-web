"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useInvitations } from "@/hooks/useInvitations";
import { invitationService } from "@/services/invitationService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Check, X, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useRouter } from "next/navigation";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function InvitationsPage() {
  const { appUser } = useAuth();
  const { invitations, loading } = useInvitations();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Activity</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Your group invitations</p>
        </header>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Activity</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Your group invitations</p>
        </div>
        {visibleInvitations.length > 0 && (
          <div
            className="h-8 px-3 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: AMBER, color: "#1a1a1a" }}
          >
            {visibleInvitations.length}
          </div>
        )}
      </header>

      {visibleInvitations.length === 0 ? (
        <Card className="border-dashed shadow-none rounded-3xl" style={{ background: "#FAFAFA" }}>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: AMBER_LIGHT }}
            >
              <Inbox className="h-8 w-8" style={{ color: AMBER }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No pending invitations</h3>
            <p className="text-gray-500 mt-2 max-w-sm text-sm leading-relaxed">
              When someone invites you to a group, it will appear here. Ask a friend to invite you!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleInvitations.map((invitation) => (
            <Card
              key={invitation.id}
              className="border-none shadow-sm rounded-2xl overflow-hidden bg-white"
            >
              {/* Amber top bar */}
              <div className="h-1 w-full" style={{ background: AMBER }} />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  {/* Group avatar */}
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shrink-0"
                    style={{ background: AMBER_LIGHT, color: AMBER }}
                  >
                    {invitation.groupName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-gray-900 text-base truncate">
                      {invitation.groupName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-700">{invitation.inviterName}</span>
                      {" "}invited you to join
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        disabled={processingId === invitation.id}
                        onClick={() => handleAccept(invitation.id, invitation.groupId)}
                        className="rounded-full px-5 font-bold text-sm h-9"
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
    </div>
  );
}
