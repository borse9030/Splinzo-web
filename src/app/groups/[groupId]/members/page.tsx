"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { invitationService } from "@/services/invitationService";
import { Invitation } from "@/types/invitation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, AlertCircle, CheckCircle2, X, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { appUser } = useAuth();
  const { group, loading } = useGroup(resolvedParams.groupId);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Fetch pending invitations for this group
  useEffect(() => {
    if (!resolvedParams.groupId) return;
    setLoadingInvites(true);
    invitationService.getGroupPendingInvitations(resolvedParams.groupId)
      .then(setPendingInvites)
      .catch(console.error)
      .finally(() => setLoadingInvites(false));
  }, [resolvedParams.groupId]);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isAdmin =
    group?.members?.find((m) => m.id === appUser?.id)?.role === "admin" ||
    group?.createdBy === appUser?.id;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !appUser || !group) return;

    if (group.members.some((m) => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      setInviteMessage({ type: "error", text: "User is already in this group." });
      return;
    }

    setInviting(true);
    setInviteMessage(null);

    try {
      await invitationService.inviteUser(group.id, group.name, appUser, inviteEmail);
      setInviteMessage({ type: "success", text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
      // Refresh pending invites list
      const updated = await invitationService.getGroupPendingInvitations(group.id);
      setPendingInvites(updated);
    } catch (err: any) {
      setInviteMessage({ type: "error", text: err.message || "Failed to send invite" });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      await invitationService.cancelInvitation(invitationId);
      // Remove from local state immediately — invitee will also stop seeing it
      setPendingInvites((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Invite Form — only admin/creator sees this */}
      {isAdmin && (
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center"
                style={{ background: AMBER_LIGHT }}
              >
                <UserPlus className="h-5 w-5" style={{ color: AMBER }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Invite a Friend</h3>
                <p className="text-sm text-gray-500">Send an email invite to join this group</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  required
                  placeholder="friend@example.com"
                  className="pl-10 rounded-xl h-11 bg-gray-50 border-gray-200"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={inviting}
                className="rounded-xl h-11 px-5 font-bold"
                style={{ background: AMBER, color: "#1a1a1a" }}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </form>

            {inviteMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${
                  inviteMessage.type === "error"
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {inviteMessage.type === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                {inviteMessage.text}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations — visible to admin with Cancel button */}
      {isAdmin && !loadingInvites && pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">
            Pending Invites ({pendingInvites.length})
          </h3>
          {pendingInvites.map((inv) => (
            <Card key={inv.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: "#FFC107" }} />
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: AMBER_LIGHT }}
                  >
                    <Clock className="h-5 w-5" style={{ color: AMBER }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{inv.invitedEmail}</p>
                    <p className="text-xs text-gray-400 font-medium">Invite pending · waiting for response</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancellingId === inv.id}
                  onClick={() => handleCancelInvite(inv.id)}
                  className="rounded-full h-8 px-4 text-xs font-bold border-red-200 text-red-500 hover:bg-red-50 shrink-0"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  {cancellingId === inv.id ? "Cancelling..." : "Cancel"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">
          Members ({group?.members?.length || 0})
        </h3>
        {group?.members?.map((member) => (
          <Card key={member.id} className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                <AvatarFallback
                  className="font-bold"
                  style={{ background: AMBER_LIGHT, color: AMBER }}
                >
                  {(member.name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-gray-900 truncate">
                    {member.name} {member.id === appUser?.id && "(You)"}
                  </h4>
                  {(member.role === "admin" || group.createdBy === member.id) && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: AMBER_LIGHT, color: "#B8860B" }}
                    >
                      {member.role === "admin" ? "Admin" : "Creator"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate font-medium">{member.email}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
