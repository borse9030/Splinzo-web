"use client";

import { useState, useEffect } from "react";
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
  QrCode, 
  Copy, 
  Ghost,
  Check,
  Share2
} from "lucide-react";
import { GroupMember } from "@/types/group";
import { QRCodeSVG } from "qrcode.react";

const AMBER = "#F9B912";

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  inviteCode?: string;
  initialTab?: "email" | "ghost" | "qr";
  groupMembers?: GroupMember[];
  isAdmin?: boolean;
  onSuccess?: () => void;
}

export function AddMemberDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  inviteCode,
  initialTab = "email",
  groupMembers = [],
  isAdmin = false,
  onSuccess,
}: AddMemberDialogProps) {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"email" | "ghost" | "qr">(initialTab);
  const [email, setEmail] = useState("");
  const [ghostName, setGhostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const effectiveCode = inviteCode || groupId.substring(0, 6).toUpperCase();
  const inviteUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/join/${effectiveCode}` 
    : `https://splinzo.in/join/${effectiveCode}`;

  const resetState = () => {
    setEmail("");
    setGhostName("");
    setFeedback(null);
    setLoading(false);
    setCopied(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! 👋 Join our group "${groupName}" on Splinzo to split expenses and track bills:\n\n${inviteUrl}\n\nInvite Code: ${effectiveCode}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on Splinzo`,
          text: `Join our group "${groupName}" on Splinzo to split expenses: (Code: ${effectiveCode})`,
          url: inviteUrl,
        });
      } catch {
        // Dismissed or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

    if (groupMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setFeedback({ type: "error", message: "User is already a member of this group." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      await invitationService.inviteUser(groupId, groupName, appUser, cleanEmail);
      setFeedback({
        type: "success",
        message: `Invitation sent successfully to ${cleanEmail}!`,
      });
      setEmail("");
      if (onSuccess) onSuccess();
      setTimeout(handleClose, 1500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to add member. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGhostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ghostName.trim();
    if (!trimmed) {
      setFeedback({ type: "error", message: "Please enter a name for this ghost member." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      await groupService.addShadowMember(groupId, trimmed);
      setFeedback({
        type: "success",
        message: `Added "${trimmed}" as a ghost member! You can now split expenses with them.`,
      });
      setGhostName("");
      if (onSuccess) onSuccess();
      setTimeout(handleClose, 1500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to add ghost member.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-3xl bg-white border border-gray-100 text-gray-900 shadow-2xl">
        {/* Brand Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="p-6 sm:p-7 space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                  Add to {groupName}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 font-medium pt-0.5">
                  Invite friends via email, add a temporary ghost member, or share a QR code.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Tab Selection */}
          <div className="grid grid-cols-3 gap-1 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => { setActiveTab("email"); setFeedback(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "email" 
                  ? "bg-white text-gray-900 shadow-xs font-bold" 
                  : "text-gray-500 hover:text-gray-900 font-medium"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Email Invite
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("ghost"); setFeedback(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "ghost" 
                  ? "bg-white text-gray-900 shadow-xs font-bold" 
                  : "text-gray-500 hover:text-gray-900 font-medium"
              }`}
            >
              <Ghost className="w-3.5 h-3.5 text-amber-500" />
              Ghost Member
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("qr"); setFeedback(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "qr" 
                  ? "bg-white text-gray-900 shadow-xs font-bold" 
                  : "text-gray-500 hover:text-gray-900 font-medium"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-purple-600" />
              QR & Link
            </button>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`flex items-start gap-2.5 p-3.5 rounded-2xl text-xs font-medium border ${
                feedback.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              )}
              <p className="leading-snug">{feedback.message}</p>
            </div>
          )}

          {/* Tab 1: Email Invite */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Member's Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. friend@example.com"
                    className="pl-10 h-12 bg-gray-50/80 border-gray-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-gray-900 placeholder:text-gray-400 rounded-2xl text-sm font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#F9B912] hover:bg-[#E5A80B] text-gray-950 font-bold rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Tab 2: Ghost Member */}
          {activeTab === "ghost" && (
            <form onSubmit={handleGhostSubmit} className="space-y-4 pt-1">
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Add someone by name right now without waiting for them to sign up. When they join Splinzo later, their debts will merge automatically!
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Friend's Name</Label>
                <div className="relative">
                  <Ghost className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={ghostName}
                    onChange={(e) => setGhostName(e.target.value)}
                    placeholder="e.g. Rahul, Alex, Mom"
                    className="pl-10 h-12 bg-gray-50/80 border-gray-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-gray-900 placeholder:text-gray-400 rounded-2xl text-sm font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#F9B912] hover:bg-[#E5A80B] text-gray-950 font-bold rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Ghost Member...
                  </>
                ) : (
                  <>
                    <Ghost className="w-4 h-4 mr-2" />
                    Add Ghost Member
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Tab 3: QR Code & Link */}
          {activeTab === "qr" && (
            <div className="space-y-4 pt-1 text-center">
              <div className="bg-white p-5 rounded-2xl w-fit mx-auto shadow-sm border border-gray-200/80">
                <QRCodeSVG value={inviteUrl} size={160} />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                <span className="text-xs font-mono text-gray-900 tracking-wider font-extrabold">
                  CODE: {effectiveCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F9B912] hover:bg-[#E5A80B] text-gray-950 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-gray-950" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-950" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>💬</span>
                  <span>Share WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-200/80 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-gray-600" />
                  <span>Share Invite</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 font-medium">
                Friends can scan the QR code or use the invite code / link to join {groupName} instantly.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
