"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCall } from "@/contexts/CallContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { AudioSettingsModal } from "@/components/call/AudioSettingsModal";

function formatDuration(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

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
  audioLevel = 0,
}: {
  uid: string;
  name: string;
  photo?: string;
  isLocal?: boolean;
  isConnecting?: boolean;
  isMuted?: boolean;
  audioLevel?: number;
}) {
  const isSpeaking = !isMuted && audioLevel > 14;

  return (
    <div className="flex flex-col items-center gap-3 transition-all">
      <div
        className="relative rounded-full overflow-hidden shadow-2xl transition-all duration-200"
        style={{
          width: 108,
          height: 108,
          border: isSpeaking
            ? "4px solid #10B981"
            : isLocal
            ? "4px solid #F9B912"
            : "4px solid rgba(255,255,255,0.15)",
          boxShadow: isSpeaking
            ? `0 0 ${Math.min(32, 16 + audioLevel / 3)}px rgba(16, 185, 129, 0.7)`
            : isLocal
            ? "0 0 20px rgba(249,185,18,0.3)"
            : undefined,
          transform: isSpeaking ? "scale(1.04)" : "scale(1)",
        }}
      >
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl font-bold text-white select-none"
            style={{ background: avatarColor(uid) }}
          >
            {name[0]?.toUpperCase() || "?"}
          </div>
        )}

        {/* Pulsing halo when actively speaking */}
        {isSpeaking && (
          <span
            className="absolute inset-0 rounded-full animate-ping pointer-events-none"
            style={{
              border: "3px solid rgba(16, 185, 129, 0.6)",
              animationDuration: "1.2s",
            }}
          />
        )}

        {/* Connecting spinner */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Muted indicator */}
        {isMuted && !isConnecting && (
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-white/20">
            <MicOff className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span className="text-white text-sm font-semibold tracking-wide flex items-center gap-1.5">
          {isLocal ? "You" : name}
          {isSpeaking && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </span>
        <span className="text-[11px] font-medium" style={{ color: isSpeaking ? "#34D399" : "rgba(255,255,255,0.4)" }}>
          {isConnecting ? "Connecting..." : isSpeaking ? "Speaking" : isMuted ? "Muted" : "Active"}
        </span>
      </div>
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
  const {
    activeCall,
    remoteStreams,
    isJoined,
    endCall,
    toggleMute,
    isMuted,
    isSpeakerOn,
    toggleSpeaker,
    speakerVolume,
    setSpeakerVolume,
    isDeafened,
    toggleDeafen,
    localAudioLevel,
    remoteAudioLevels,
    needsAudioUnlock,
    unlockAudio,
  } = useCall();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // If user navigates here directly without an active call, redirect back
  useEffect(() => {
    if (!activeCall && !isJoined) {
      router.replace("/dashboard");
    }
  }, [activeCall, isJoined, router]);

  useEffect(() => {
    if (!activeCall || activeCall.participants.length <= 1) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.participants.length]);

  if (!activeCall) return null;

  const volumePercent = Math.round(speakerVolume * 100);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col select-none overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, #1e1b4b 0%, #0f172a 60%, #030712 100%)",
      }}
    >
      {/* Autoplay Unlock Notice (if browser blocked sound) */}
      {needsAudioUnlock && (
        <div
          onClick={unlockAudio}
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 flex items-center justify-center gap-2 font-semibold text-xs transition-all cursor-pointer shadow-lg animate-pulse"
        >
          <AlertCircle className="w-4 h-4 fill-current" />
          <span>Call audio is paused by your browser. Click here to enable speaker sound.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-4 px-6 relative">
        {/* Top Badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            HD Voice · 64kbps
          </span>
          {isSpeakerOn && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Radio className="w-3 h-3" />
              Speaker Mode
            </span>
          )}
        </div>

        <h1 className="text-white text-2xl md:text-3xl font-bold tracking-tight text-center">
          {activeCall.groupName}
        </h1>
        <p className="text-white/60 text-xs md:text-sm mt-1 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-white/50" />
            {activeCall.participants.length} participant
            {activeCall.participants.length !== 1 ? "s" : ""}
          </span>
          <span>•</span>
          <span className="font-mono text-emerald-400">
            {activeCall.status === "ringing" && activeCall.participants.length <= 1
              ? "Calling group…"
              : formatDuration(elapsedSeconds)}
          </span>
        </p>
      </div>

      {/* Participant Grid */}
      <div className="flex-1 flex flex-wrap items-center justify-center gap-8 md:gap-12 px-6 py-4 overflow-y-auto max-w-5xl mx-auto w-full">
        {/* Local user tile */}
        {appUser && (
          <ParticipantTile
            key={appUser.id}
            uid={appUser.id}
            name={appUser.displayName || "You"}
            photo={appUser.photoUrl || undefined}
            isLocal
            isMuted={isMuted}
            audioLevel={localAudioLevel}
          />
        )}

        {/* Remote participant tiles */}
        {activeCall.participants.map((uid) => {
          if (uid === appUser?.id) return null;
          const name = activeCall.participantNames[uid] || "Participant";
          const photo = activeCall.participantPhotos[uid];
          const hasStream = !!remoteStreams[uid];
          const level = remoteAudioLevels[uid] || 0;
          return (
            <ParticipantTile
              key={uid}
              uid={uid}
              name={name}
              photo={photo}
              isConnecting={!hasStream}
              audioLevel={level}
            />
          );
        })}
      </div>

      {/* Desktop & Mobile Control Dock */}
      <div className="flex flex-col items-center gap-4 pb-10 px-4">
        {/* Dynamic status chip */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold tracking-wide px-3.5 py-1 rounded-full transition-all flex items-center gap-1.5"
            style={{
              background: isMuted ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.15)",
              color: isMuted ? "#FCA5A5" : "#6EE7B7",
              border: isMuted ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
            }}
          >
            {isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                Mic Muted
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                Mic Live {localAudioLevel > 12 && "· Transmitting"}
              </>
            )}
          </span>

          {isDeafened && (
            <span className="text-xs font-semibold tracking-wide px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
              <VolumeX className="w-3.5 h-3.5" />
              Incoming Sound Deafened
            </span>
          )}
        </div>

        {/* Floating Control Bar */}
        <div
          className="relative flex items-center gap-3 md:gap-5 px-5 py-3 rounded-3xl backdrop-blur-xl border shadow-2xl transition-all"
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.7)",
          }}
        >
          {/* Quick Volume Slider Popover */}
          {showVolumeSlider && (
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex items-center gap-3 w-64 z-20"
              style={{ animation: "scaleUp 0.15s ease" }}
            >
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={speakerVolume}
                onChange={(e) => setSpeakerVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white shrink-0">
                {volumePercent}%
              </span>
            </div>
          )}

          {/* 1. Mic Mute / Unmute */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
              style={{
                background: isMuted ? "#EF4444" : "rgba(255, 255, 255, 0.12)",
                boxShadow: isMuted
                  ? "0 0 0 3px rgba(239,68,68,0.3), 0 0 20px rgba(239,68,68,0.4)"
                  : !isMuted && localAudioLevel > 15
                  ? "0 0 0 3px rgba(16,185,129,0.3), 0 0 15px rgba(16,185,129,0.4)"
                  : undefined,
              }}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            <span className="text-[11px] text-white/50">{isMuted ? "Unmute" : "Mute"}</span>
          </div>

          {/* 2. Speaker Mode Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleSpeaker}
              title="Toggle Loudspeaker Mode"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
              style={{
                background: isSpeakerOn ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.12)",
                border: isSpeakerOn ? "2px solid #F59E0B" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isSpeakerOn ? "0 0 20px rgba(245, 158, 11, 0.3)" : undefined,
              }}
            >
              <Radio className={`w-6 h-6 ${isSpeakerOn ? "text-amber-400" : "text-white"}`} />
            </button>
            <span className="text-[11px] text-white/50">{isSpeakerOn ? "Speaker On" : "Speaker Off"}</span>
          </div>

          {/* 3. Speaker Volume / Quick Slider Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowVolumeSlider((prev) => !prev)}
              title="Adjust Speaker Volume"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/15 active:scale-90 transition-all cursor-pointer shadow-lg border border-white/10"
            >
              <Volume2 className="w-6 h-6 text-white" />
            </button>
            <span className="text-[11px] text-white/50">{volumePercent}% Vol</span>
          </div>

          {/* 4. Deafen Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleDeafen}
              title={isDeafened ? "Undeafen Audio" : "Deafen Audio (Silence Incoming)"}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
              style={{
                background: isDeafened ? "#EF4444" : "rgba(255, 255, 255, 0.12)",
                boxShadow: isDeafened ? "0 0 20px rgba(239,68,68,0.4)" : undefined,
              }}
            >
              <VolumeX className="w-6 h-6 text-white" />
            </button>
            <span className="text-[11px] text-white/50">{isDeafened ? "Deafened" : "Deafen"}</span>
          </div>

          {/* 5. Device & Audio Settings Modal Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Audio Output & Microphone Settings"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/15 active:scale-90 transition-all cursor-pointer shadow-lg border border-white/10"
            >
              <Sliders className="w-6 h-6 text-amber-400" />
            </button>
            <span className="text-[11px] text-white/50">Settings</span>
          </div>

          {/* 6. End Call Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={endCall}
              title="Leave / End Call"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.6)]"
              style={{ background: "#EF4444" }}
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-[11px] text-white/50">Leave</span>
          </div>
        </div>
      </div>

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
