"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { invitationService } from "@/services/invitationService";
import { groupService } from "@/services/groupService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Send, 
  UserCheck 
} from "lucide-react";
import { GroupMember } from "@/types/group";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupMembers?: GroupMember[];
  isAdmin?: boolean;
  onSuccess?: () => void;
}

export function AddMemberDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  groupMembers = [],
  isAdmin = false,
  onSuccess,
}: AddMemberDialogProps) {
  const { appUser } = useAuth();
  const [email, setEmail] = useState("");
  const [addMode, setAddMode] = useState<"invite" | "direct">("invite");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const resetState = () => {
    setEmail("");
    setFeedback(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    if (!appUser) {
      setFeedback({ type: "error", message: "You must be signed in to perform this action." });
      return;
    }

    // Quick client-side check if already in group
    if (groupMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setFeedback({ type: "error", message: "User is already a member of this group." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      if (isAdmin && addMode === "direct") {
        // Direct addition: user is added directly into group members array
        const newMember = await groupService.addMemberToGroup(groupId, cleanEmail);
        setFeedback({
          type: "success",
          message: `Successfully added ${newMember.name || cleanEmail} to the group!`,
        });
      } else {
        // Standard invitation flow matching mobile app
        await invitationService.inviteUser(groupId, groupName, appUser, cleanEmail);
        setFeedback({
          type: "success",
          message: `Invitation sent successfully to ${cleanEmail}!`,
        });
      }

      setEmail("");
      if (onSuccess) {
        onSuccess();
      }

      // Close modal smoothly after successful feedback
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to add member. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-xl bg-white dark:bg-zinc-900">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: AMBER_LIGHT }}
            >
              <UserPlus className="h-6 w-6" style={{ color: AMBER }} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isAdmin && addMode === "direct" ? "Add Member Directly" : "Invite Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                Add friends to <span className="font-semibold text-gray-700 dark:text-gray-300">{groupName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Enter the email address of the person you want to add to this group. They must already have a Splinzo account.
        </p>

        {/* Mode Selector (for group admin/creator) */}
        {isAdmin && (
          <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-zinc-800 text-xs font-semibold mt-2">
            <button
              type="button"
              onClick={() => {
                setAddMode("invite");
                setFeedback(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                addMode === "invite"
                  ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Send className="h-3.5 w-3.5 text-amber-500" />
              <span>Send Invite</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode("direct");
                setFeedback(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                addMode === "direct"
                  ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-500" />
              <span>Add Instantly</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="member-email" className="text-xs font-bold text-gray-600 dark:text-gray-300">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <Input
                id="member-email"
                type="email"
                required
                autoFocus
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                disabled={loading}
                className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-sm focus-visible:ring-amber-400"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-sm flex items-start gap-2.5 transition-all ${
                feedback.type === "error"
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                  : "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-900/50"
              }`}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
              )}
              <span className="text-xs font-medium leading-relaxed">{feedback.message}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-bold border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 h-12 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{addMode === "direct" ? "Adding..." : "Sending..."}</span>
                </span>
              ) : (
                <span>{isAdmin && addMode === "direct" ? "Add Member" : "Send Invite"}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
