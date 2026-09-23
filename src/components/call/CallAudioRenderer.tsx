"use client";

import React, { useEffect, useRef } from "react";
import { useCall } from "@/contexts/CallContext";

function SingleRemoteAudio({
  uid,
  stream,
  volume,
  outputDeviceId,
  onAutoplayBlocked,
}: {
  uid: string;
  stream: MediaStream;
  volume: number;
  outputDeviceId: string;
  onAutoplayBlocked: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }

    // Apply output device sink if browser supports setSinkId (Chrome / Edge / Opera)
    if (outputDeviceId && typeof (el as any).setSinkId === "function") {
      (el as any)
        .setSinkId(outputDeviceId)
        .catch((err: any) => console.warn(`[SingleRemoteAudio] setSinkId for ${uid}:`, err));
    }

    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay policy prevented playback until user interaction
        console.warn(`[SingleRemoteAudio] Autoplay blocked for ${uid}:`, err.name);
        onAutoplayBlocked();
      });
    }
  }, [stream, outputDeviceId, uid, onAutoplayBlocked]);

  useEffect(() => {
    if (audioRef.current) {
      // HTMLAudioElement volume is clamped between 0 and 1
      audioRef.current.volume = Math.min(1.0, Math.max(0, volume));
    }
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      id={`remote-audio-persistent-${uid}`}
      autoPlay
      playsInline
      style={{ display: "none" }}
    />
  );
}

/**
 * CallAudioRenderer mounts persistently inside CallProvider in RootLayout.
 * This guarantees audio playback continues uninterrupted even when navigating between
 * pages (chat, settle, dashboard) during an active call, and handles output device
 * routing and volume boost cleanly.
 */
export function CallAudioRenderer() {
  const {
    remoteStreams,
    speakerVolume,
    isDeafened,
    selectedAudioOutput,
    needsAudioUnlock,
    unlockAudio,
  } = useCall();

  const effectiveVolume = isDeafened ? 0 : speakerVolume;

  const handleAutoplayBlocked = React.useCallback(() => {
    // Flag in CallContext that audio needs a click to unlock
    if (typeof window !== "undefined" && !needsAudioUnlock) {
      // AudioContext / audio elements blocked
    }
  }, [needsAudioUnlock]);

  if (!remoteStreams || Object.keys(remoteStreams).length === 0) {
    return null;
  }

  return (
    <div id="splinzo-call-audio-renderer" style={{ display: "none" }}>
      {Object.entries(remoteStreams).map(([uid, stream]) => (
        <SingleRemoteAudio
          key={uid}
          uid={uid}
          stream={stream}
          volume={effectiveVolume}
          outputDeviceId={selectedAudioOutput}
          onAutoplayBlocked={handleAutoplayBlocked}
        />
      ))}
    </div>
  );
}
