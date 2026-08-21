"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useInvitations } from "@/hooks/useInvitations";
import { invitationService } from "@/services/invitationService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Inbox, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvitationsPage() {
  const { appUser } = useAuth();
  const { invitations, loading } = useInvitations();
  const [processingId, setProcessingId] = useState<string | null>(null);
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
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Invitations</h1>
        {[1, 2].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
        <p className="text-gray-500">Manage your group invites</p>
      </header>

      {invitations.length === 0 ? (
        <Card className="border-dashed shadow-none bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold">No pending invitations</h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              When someone invites you to a group, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="border-none shadow-sm">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${invitation.groupId}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {invitation.groupName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-gray-900">{invitation.groupName}</h3>
                    <p className="text-sm text-gray-500">
                      Invited by <span className="font-medium text-gray-700">{invitation.invitedByUserName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none rounded-xl"
                    disabled={processingId === invitation.id}
                    onClick={() => handleDecline(invitation.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button 
                    className="flex-1 sm:flex-none rounded-xl"
                    disabled={processingId === invitation.id}
                    onClick={() => handleAccept(invitation.id, invitation.groupId)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {processingId === invitation.id ? "Accepting..." : "Accept"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
