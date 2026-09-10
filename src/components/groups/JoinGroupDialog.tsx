"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Group } from "@/types/group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, KeyRound, Clipboard, AlertCircle, Loader2, Users } from "lucide-react";

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGroupDialog({ isOpen, onClose }: JoinGroupDialogProps) {
  const router = useRouter();
  const { appUser } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.trim();
      if (clean) {
        if (clean.includes("/join/")) {
          const parts = clean.split("/join/");
          const extracted = parts[1].split(/[?#/]/)[0];
          setCode(extracted.toUpperCase());
        } else {
          setCode(clean.toUpperCase());
        }
        setError(null);
      }
    } catch {
      // Clipboard permissions denied
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("Please enter a group invite code.");
      return;
    }

    if (!appUser) {
      setError("You must be logged in to join a group.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Search by inviteCode
      let foundGroupDoc: any = null;
      const q = query(collection(db, "groups"), where("inviteCode", "==", cleanCode));
      const snap = await getDocs(q);

      if (!snap.empty) {
        foundGroupDoc = snap.docs[0];
      } else {
        // Fallback: check if cleanCode is document ID
        const directDoc = await getDoc(doc(db, "groups", cleanCode.toLowerCase()));
        if (directDoc.exists()) {
          foundGroupDoc = directDoc;
        }
      }

      if (!foundGroupDoc) {
        setError(`No group found with invite code "${cleanCode}". Please verify and try again.`);
        setLoading(false);
        return;
      }

      const groupId = foundGroupDoc.id;
      const groupData = foundGroupDoc.data();
      const alreadyMember = groupData.memberIds?.includes(appUser.id);

      if (!alreadyMember) {
        const newMember = {
          id: appUser.id,
          name: appUser.displayName || appUser.name || "Member",
          email: appUser.email || "",
          photoUrl: appUser.photoUrl || appUser.photoURL || null,
          role: "member",
          joinedAt: new Date(),
          isShadow: false,
        };

        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
          memberIds: arrayUnion(appUser.id),
          members: arrayUnion(newMember),
        });
      }

      onClose();
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      console.error("Join error:", err);
      setError(err.message || "Failed to join group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-2xl">
        {/* Brand Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="p-6 sm:p-7 space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                  Join Group
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 font-medium pt-0.5">
                  Enter a 6-character group invite code or link
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4 pt-1">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="e.g. KNQ9PV"
                maxLength={30}
                className="pl-10 pr-12 h-12 rounded-2xl text-base font-mono uppercase font-bold tracking-wider bg-gray-50/80 border-gray-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-gray-900 placeholder:text-gray-400 transition-all"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer"
                title="Paste from clipboard"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-2xl font-semibold border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="flex-1 h-12 rounded-2xl font-bold bg-[#F9B912] hover:bg-[#E5A80B] text-gray-950 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Join Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
