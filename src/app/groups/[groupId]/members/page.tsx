"use client";

import { use, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { invitationService } from "@/services/invitationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [inviteMessage, setInviteMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm">
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

  const isAdmin = group?.members?.find(m => m.id === appUser?.id)?.role === 'admin' || group?.createdBy === appUser?.id;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !appUser || !group) return;
    
    // Check if already a member
    if (group.members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      setInviteMessage({ type: "error", text: "User is already in this group." });
      return;
    }
    
    setInviting(true);
    setInviteMessage(null);
    
    try {
      await invitationService.inviteUser(group.id, group.name, appUser, inviteEmail);
      setInviteMessage({ type: "success", text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
    } catch (err: any) {
      setInviteMessage({ type: "error", text: err.message || "Failed to send invite" });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Invite Form */}
      {isAdmin && (
        <Card className="border-dashed border-2 shadow-sm bg-gray-50/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Invite a Friend</h3>
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
                  className="pl-10 rounded-xl h-11 bg-white"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={inviting} className="rounded-xl h-11 px-6">
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </form>
            
            {inviteMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                inviteMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
              }`}>
                {inviteMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {inviteMessage.text}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pl-1">Members ({group?.members?.length || 0})</h3>
        {group?.members?.map((member) => (
          <Card key={member.id} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 truncate">
                    {member.name} {member.id === appUser?.id && "(You)"}
                  </h4>
                  {member.role === 'admin' && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                  {group.createdBy === member.id && member.role !== 'admin' && (
                     <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                     Creator
                   </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{member.email}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
