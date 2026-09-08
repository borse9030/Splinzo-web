"use client";

import { useState, useEffect } from "react";
import { GroupMember, Group } from "@/types/group";
import { AppUser } from "@/types/user";
import { userService } from "@/services/userService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Quote,
  Wallet,
  Copy,
  Check,
  Calendar,
  Shield,
  User as UserIcon,
  ExternalLink,
  Mail,
  Phone,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface MemberProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: GroupMember | null;
  group?: Group | null;
  isCurrentUser?: boolean;
}

export function MemberProfileDialog({
  isOpen,
  onClose,
  member,
  group,
  isCurrentUser,
}: MemberProfileDialogProps) {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!member?.id || !isOpen) {
      setUserData(null);
      return;
    }

    setLoading(true);
    userService
      .getUser(member.id)
      .then((data) => setUserData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [member?.id, isOpen]);

  if (!member) return null;

  const displayName =
    userData?.displayName ||
    userData?.name ||
    member.displayName ||
    member.name ||
    "Splinzo User";

  const photoUrl =
    userData?.photoUrl ||
    userData?.photoURL ||
    member.photoUrl ||
    member.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`;

  const bio = userData?.bio || "";
  const upiId = userData?.upiId || "";
  const phone = userData?.phoneNumber || userData?.phone || "";
  const email = member.email || userData?.email || "";

  const isCreator = group?.createdBy === member.id;
  const isAdmin = member.role === "admin" || isCreator;

  let joinedDateStr = "";
  if (member.joinedAt) {
    try {
      const date =
        typeof member.joinedAt.toDate === "function"
          ? member.joinedAt.toDate()
          : new Date((member.joinedAt as any).seconds * 1000);
      joinedDateStr = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (_) {
      joinedDateStr = "";
    }
  }

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white dark:bg-card">
        {/* Amber brand accent line */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="p-6 sm:p-7 space-y-5">
          <DialogHeader className="sr-only">
            <DialogTitle>{displayName}&apos;s Profile</DialogTitle>
          </DialogHeader>

          {/* Profile Header & Avatar */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-amber-100 dark:ring-amber-950/40 shadow-lg">
                <AvatarImage src={photoUrl} className="object-cover" />
                <AvatarFallback className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-black text-3xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {isAdmin && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-wider uppercase shadow-sm">
                  {isCreator ? "Creator" : "Admin"}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-black text-gray-950 dark:text-white">
                  {displayName}
                </h3>
                {isCurrentUser && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    You
                  </span>
                )}
              </div>
              {email && (
                <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 font-medium">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* ── BIO TAGLINE SECTION ───────────────────────────────── */}
          {bio ? (
            <div className="relative p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-left">
              <div className="flex gap-2.5">
                <Quote className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 italic leading-relaxed">
                  &ldquo;{bio}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center justify-center gap-1.5">
                <Quote className="h-3 w-3 text-gray-300" />
                No bio added yet
              </p>
            </div>
          )}

          {/* ── SETTLEMENT & UPI DETAILS ──────────────────────────── */}
          {upiId ? (
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-400">
                    UPI for Settlements
                  </p>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {upiId}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyUpi}
                className="rounded-xl h-8 px-3 text-xs font-bold shrink-0 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ) : isCurrentUser ? (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    UPI ID Missing
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                    You haven&apos;t added your UPI ID yet. Other group members cannot settle debts with you via UPI.
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                className="w-full h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
              >
                <Link href="/dashboard/profile">
                  Add UPI ID in Profile
                </Link>
              </Button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  No UPI ID Linked
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                  {displayName} has not added a UPI ID yet. Direct digital settlement via UPI is unavailable.
                </p>
              </div>
            </div>
          )}

          {/* ── GROUP METADATA ────────────────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            {joinedDateStr ? (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>Joined {joinedDateStr}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <span>Group Member</span>
              </div>
            )}

            <span className="font-bold text-gray-700 dark:text-gray-300 capitalize">
              {member.role}
            </span>
          </div>

          {phone && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
              <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold">{phone}</span>
            </div>
          )}

          {/* ── ACTION BUTTONS ────────────────────────────────────── */}
          <div className="pt-2 flex gap-3">
            {isCurrentUser ? (
              <Link href="/dashboard/profile" className="w-full">
                <Button className="w-full rounded-xl h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Edit My Profile
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full rounded-xl h-11 border-gray-200 dark:border-gray-800 font-bold"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
