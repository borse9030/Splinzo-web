"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { db, auth, googleProvider } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Group, GroupMember } from "@/types/group";
import { Users, LogIn, ExternalLink, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const rawCode = resolvedParams.code || "";
  const code = decodeURIComponent(rawCode).trim().toUpperCase();

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      if (!code) {
        setError("Invalid invite link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Search by inviteCode
        const q = query(collection(db, "groups"), where("inviteCode", "==", code));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setGroup({ id: snap.docs[0].id, ...docData } as Group);
        } else {
          // Fallback: check if code is direct document ID
          const directDoc = await getDoc(doc(db, "groups", code.toLowerCase()));
          if (directDoc.exists()) {
            setGroup({ id: directDoc.id, ...directDoc.data() } as Group);
          } else {
            setError(`No group found with invite code "${code}". Please verify the link.`);
          }
        }
      } catch (err: any) {
        console.error("Error fetching group:", err);
        setError("Failed to load group details. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchGroup();
  }, [code]);

  async function handleJoin() {
    if (!group) return;

    if (!user) {
      try {
        setIsJoining(true);
        const cred = await signInWithPopup(auth, googleProvider);
        const signedUser = cred.user;
        await completeJoin(signedUser);
      } catch (err: any) {
        console.error("Auth error:", err);
        setIsJoining(false);
      }
      return;
    }

    await completeJoin(user);
  }

  async function completeJoin(currentUser: any) {
    if (!group) return;
    setIsJoining(true);

    try {
      const alreadyMember = group.memberIds?.includes(currentUser.uid);

      if (!alreadyMember) {
        const newMember: any = {
          id: currentUser.uid,
          name: currentUser.displayName || "Member",
          email: currentUser.email || "",
          photoUrl: currentUser.photoURL || null,
          role: "member",
          joinedAt: new Date(),
          isShadow: false,
        };

        const groupRef = doc(db, "groups", group.id);
        await updateDoc(groupRef, {
          memberIds: arrayUnion(currentUser.uid),
          members: arrayUnion(newMember),
        });
      }

      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      console.error("Join group error:", err);
      setError("Failed to join group. Please try again.");
      setIsJoining(false);
    }
  }

  const isAlreadyMember = user && group && group.memberIds?.includes(user.uid);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Glow Effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/50">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-400/20">
              S
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">Splinzo</span>
              <p className="text-xs text-slate-400">Group Expense Tracker</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
            Invite Code: {code}
          </span>
        </div>

        {loading || authLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Finding group details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Invitation Not Found</h2>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition text-sm cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : group ? (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl mx-auto flex items-center justify-center text-3xl font-black text-slate-950 shadow-xl shadow-amber-500/20">
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{group.name}</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {group.description || `${group.type || "Group"} expenses on Splinzo`}
                </p>
              </div>
            </div>

            {/* Group Stats Card */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-center">
                <span className="text-xs text-slate-500 block mb-1">Members</span>
                <span className="text-lg font-bold text-slate-200 flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  {group.members?.length || group.memberIds?.length || 1}
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-500 block mb-1">Currency</span>
                <span className="text-lg font-bold text-amber-400">{group.currency || "INR"}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base transition duration-200 shadow-xl shadow-amber-400/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isJoining ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : isAlreadyMember ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    Open Group Details
                  </>
                ) : user ? (
                  <>
                    <Users className="w-5 h-5 text-slate-950" />
                    Join {group.name}
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 text-slate-950" />
                    Sign in with Google to Join
                  </>
                )}
              </button>

              <a
                href={`splinzo://join/${code}`}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                Open in Splinzo Mobile App
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Automated UPI settlements & equal splits</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
