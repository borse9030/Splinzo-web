"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCall } from "@/contexts/CallContext";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, MicOff, PhoneOff, Users } from "lucide-react";

const AVATAR_COLORS = [
  "#E91E63", "#9C27B0", "#2196F3", "#00BCD4",
  "#4CAF50", "#FF5722", "#607D8B", "#FF9800",
];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function ParticipantTile({
  uid,
  name,
  photo,
  isLocal,
  isConnecting,
  isMuted,
}: {
  uid: string;
  name: string;
  photo?: string;
  isLocal?: boolean;
  isConnecting?: boolean;
  isMuted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3" style={{ animation: "fadeIn 0.3s ease" }}>
      <div
        className="relative rounded-full overflow-hidden shadow-2xl"
        style={{
          width: 100,
          height: 100,
          border: isLocal
            ? "4px solid #F9B912"
            : "4px solid rgba(255,255,255,0.15)",
          boxShadow: isLocal ? "0 0 24px rgba(249,185,18,0.35)" : undefined,
        }}
      >
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: avatarColor(uid) }}
          >
            {name[0]?.toUpperCase() || "?"}
          </div>
        )}

        {/* Connecting spinner */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Muted indicator */}
        {isMuted && !isConnecting && (
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-white/90 text-sm font-semibold tracking-wide">
        {isLocal ? "You" : name}
      </span>
    </div>
  );
}

export default function CallPage({
  params,
}: {
  params: Promise<{ groupId: string; callId: string }>;
}) {
  const { groupId, callId } = use(params);
  const router = useRouter();
  const { appUser } = useAuth();
  const { activeCall, localStream, remoteStreams, isJoined, endCall, toggleMute, isMuted } = useCall();

  const isLocalMuted = isMuted;

  // If user navigates here directly without an active call, redirect back
  useEffect(() => {
    if (!activeCall && !isJoined) {
      router.replace("/dashboard");
    }
  }, [activeCall, isJoined, router]);

  // Wire up hidden <audio> tags for remote streams
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([uid, stream]) => {
      const existingId = `remote-audio-${uid}`;
      let el = document.getElementById(existingId) as HTMLAudioElement | null;
      if (!el) {
        el = document.createElement("audio");
        el.id = existingId;
        el.autoplay = true;
        el.style.display = "none";
        document.body.appendChild(el);
      }
      el.srcObject = stream;
    });

    return () => {
      Object.keys(remoteStreams).forEach((uid) => {
        const el = document.getElementById(`remote-audio-${uid}`);
        el?.remove();
      });
    };
  }, [remoteStreams]);

  if (!activeCall) return null;

  const elapsedSeconds = 0; // Could wire up a timer here

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: "linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-6 px-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">
          {activeCall.groupName}
        </h1>
        <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {activeCall.participants.length} participant
          {activeCall.participants.length !== 1 ? "s" : ""}
          {activeCall.status === "ringing" ? " · Ringing…" : " · Active"}
        </p>
      </div>

      {/* Participant Grid */}
      <div className="flex-1 flex flex-wrap items-center justify-center gap-10 px-8 py-4 overflow-y-auto">
          {/* Local user tile */}
          {appUser && (
            <ParticipantTile
              key={appUser.id}
              uid={appUser.id}
              name={appUser.displayName || "You"}
              photo={appUser.photoUrl || undefined}
              isLocal
              isMuted={isLocalMuted}
            />
          )}

          {/* Remote participant tiles */}
          {activeCall.participants.map((uid) => {
            if (uid === appUser?.id) return null;
            const name = activeCall.participantNames[uid] || "Participant";
            const photo = activeCall.participantPhotos[uid];
            const hasStream = !!remoteStreams[uid];
            return (
              <ParticipantTile
                key={uid}
                uid={uid}
                name={name}
                photo={photo}
                isConnecting={!hasStream}
              />
            );
          })}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 pb-10">
        {/* Mute status label */}
        <span
          className="text-xs font-semibold tracking-wide px-3 py-1 rounded-full transition-all"
          style={{
            background: isLocalMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
            color: isLocalMuted ? "#FCA5A5" : "rgba(255,255,255,0.4)",
          }}
        >
          {isLocalMuted ? "🔇 Mic Off — you are muted" : "🎤 Mic On"}
        </span>

        <div className="flex items-center justify-center gap-8">
          {/* Mute toggle */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{
                background: isLocalMuted ? "#EF4444" : "rgba(255,255,255,0.12)",
                boxShadow: isLocalMuted
                  ? "0 0 0 4px rgba(239,68,68,0.25), 0 0 20px rgba(239,68,68,0.3)"
                  : undefined,
              }}
            >
              {isLocalMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
              {/* Pulsing ring when muted */}
              {isLocalMuted && (
                <span
                  className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                  style={{ background: "rgba(239,68,68,0.3)" }}
                />
              )}
            </button>
            <span className="text-white/40 text-[11px]">
              {isLocalMuted ? "Unmute" : "Mute"}
            </span>
          </div>

          {/* End call */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={endCall}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              style={{ background: "#EF4444" }}
            >
              <PhoneOff className="w-8 h-8" />
            </button>
            <span className="text-white/40 text-[11px]">End Call</span>
          </div>
        </div>
      </div>
    </div>
  );
}
