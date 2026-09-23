"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { CallSession } from "@/types/call";
import { CallService } from "@/services/callService";
import { PeerManager } from "@/lib/webrtc/PeerManager";

interface CallContextType {
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isRinging: boolean;
  isOngoingHover: boolean;
  isJoined: boolean;
  isConnecting: boolean;
  isMuted: boolean;

  // Desktop audio & speaker controls
  isSpeakerOn: boolean;
  speakerVolume: number; // 0.0 to 1.5
  isDeafened: boolean;
  selectedAudioInput: string;
  selectedAudioOutput: string;
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  localAudioLevel: number; // 0-100
  remoteAudioLevels: Record<string, number>; // 0-100
  needsAudioUnlock: boolean;

  // Actions
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  dismissOngoingCall: (callId: string) => void;
  endCall: () => Promise<void>;
  startCall: (groupId: string, groupName: string) => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleDeafen: () => void;
  setSpeakerVolume: (vol: number) => void;
  setAudioInputDevice: (deviceId: string) => Promise<void>;
  setAudioOutputDevice: (deviceId: string) => Promise<void>;
  unlockAudio: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, appUser } = useAuth();

  const [groupIds, setGroupIds] = useState<string[]>([]);

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Audio routing & desktop speaker states
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speakerVolume, setSpeakerVolumeState] = useState(1.0);
  const [isDeafened, setIsDeafened] = useState(false);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0);
  const [remoteAudioLevels, setRemoteAudioLevels] = useState<Record<string, number>>({});
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const peerManagerRef = useRef<PeerManager | null>(null);
  const signalUnsubRef = useRef<(() => void) | null>(null);
  const groupCallUnsubsRef = useRef<(() => void)[]>([]);
  const sessionUnsubRef = useRef<(() => void) | null>(null);
  const activeCallRef = useRef<CallSession | null>(null); // stable ref for beforeunload
  const isJoinedRef = useRef(false);
  const myUidRef = useRef<string | undefined>(undefined);
  const groupIdsRef = useRef<string[]>([]); // stable ref used by watchActiveCall
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio Context for volume analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [dismissedCallIds, setDismissedCallIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = sessionStorage.getItem("splinzo_dismissed_calls");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dismissOngoingCall = useCallback((callId: string) => {
    setDismissedCallIds((prev) => {
      const next = new Set(prev).add(callId);
      try {
        sessionStorage.setItem("splinzo_dismissed_calls", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const callAgeSeconds = useMemo(() => {
    if (!activeCall?.createdAt) return 0;
    const createdMillis =
      activeCall.createdAt?.toMillis?.() ??
      (typeof activeCall.createdAt === "number"
        ? activeCall.createdAt
        : new Date(activeCall.createdAt).getTime());
    if (!createdMillis || isNaN(createdMillis)) return 0;
    return Math.abs((Date.now() - createdMillis) / 1000);
  }, [activeCall?.createdAt]);

  const isRinging =
    activeCall !== null &&
    !isJoined &&
    activeCall.status === "ringing" &&
    activeCall.callerId !== appUser?.id &&
    !dismissedCallIds.has(activeCall.id) &&
    !activeCall.rejectedBy?.includes(appUser?.id ?? "") &&
    !activeCall.participants?.includes(appUser?.id ?? "") &&
    callAgeSeconds < 35;

  const isOngoingHover =
    activeCall !== null &&
    !isJoined &&
    !isRinging &&
    (activeCall.status === "active" || activeCall.status === "ringing") &&
    activeCall.callerId !== appUser?.id &&
    !dismissedCallIds.has(activeCall.id) &&
    !activeCall.rejectedBy?.includes(appUser?.id ?? "") &&
    !activeCall.participants?.includes(appUser?.id ?? "") &&
    activeCall.participants.length > 0;

  // ── Audio Device Enumeration ─────────────────────────────────────────
  const refreshAudioDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "audioinput");
      const outputs = devices.filter((d) => d.kind === "audiooutput");

      setAudioInputs(inputs);
      setAudioOutputs(outputs);

      if (inputs.length > 0 && !selectedAudioInput) {
        setSelectedAudioInput(inputs[0].deviceId);
      }
      if (outputs.length > 0 && !selectedAudioOutput) {
        const savedOutput = typeof localStorage !== "undefined" ? localStorage.getItem("splinzo_audio_output") : null;
        const exists = outputs.some((o) => o.deviceId === savedOutput);
        setSelectedAudioOutput(exists && savedOutput ? savedOutput : outputs[0].deviceId);
      }
    } catch (e) {
      console.warn("[refreshAudioDevices]", e);
    }
  }, [selectedAudioInput, selectedAudioOutput]);

  useEffect(() => {
    refreshAudioDevices();
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", refreshAudioDevices);
      return () => navigator.mediaDevices.removeEventListener("devicechange", refreshAudioDevices);
    }
  }, [refreshAudioDevices]);

  // ── Ringtone for incoming call ─────────────────────────────────────────
  useEffect(() => {
    if (isRinging) {
      if (!ringAudioRef.current) {
        ringAudioRef.current = new Audio("/ring.mp3");
        ringAudioRef.current.loop = true;
        ringAudioRef.current.volume = 0.8;
      }
      ringAudioRef.current.play().catch((e) => {
        console.log("[Ringtone] Auto-play prevented:", e);
        setNeedsAudioUnlock(true);
      });
    } else {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current.currentTime = 0;
      }
    }
  }, [isRinging]);

  // ── Ringback audio for caller while waiting ──────────────────────────
  useEffect(() => {
    const isCallerWaiting =
      activeCall !== null &&
      isJoined &&
      activeCall.callerId === appUser?.id &&
      activeCall.status === "ringing" &&
      activeCall.participants.length === 1;

    if (isCallerWaiting) {
      if (!ringbackAudioRef.current) {
        ringbackAudioRef.current = new Audio("/ring.mp3");
        ringbackAudioRef.current.loop = true;
        ringbackAudioRef.current.volume = 0.6;
      }
      ringbackAudioRef.current.play().catch((e) => {
        console.log("[Ringback] Auto-play prevented:", e);
        setNeedsAudioUnlock(true);
      });
    } else {
      if (ringbackAudioRef.current) {
        ringbackAudioRef.current.pause();
        ringbackAudioRef.current.currentTime = 0;
      }
    }
  }, [activeCall?.status, activeCall?.participants.length, isJoined, appUser?.id]);

  // Keep refs in sync
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { isJoinedRef.current = isJoined; }, [isJoined]);
  useEffect(() => { myUidRef.current = appUser?.id; }, [appUser]);
  useEffect(() => { groupIdsRef.current = groupIds; }, [groupIds]);

  // Clear state on user change/logout to prevent cross-account leakage
  useEffect(() => {
    if (!user?.uid) {
      setActiveCall(null);
      setIsJoined(false);
      setIsConnecting(false);
      setIsMuted(false);
      setRemoteStreams({});
    }
  }, [user?.uid]);

  // ── Fetch user's group IDs directly from Firestore ────────────────────
  useEffect(() => {
    if (!user?.uid) { setGroupIds([]); return; }

    const q = query(
      collection(db, "groups"),
      where("memberIds", "array-contains", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs.map((d) => d.id);
      setGroupIds(ids);
    }, (err) => {
      console.error("[CallProvider] Failed to fetch group IDs:", err);
    });

    return () => unsub();
  }, [user?.uid]);

  // ── Tab / browser close cleanup ──────────────────────────────────────
  useEffect(() => {
    const onBeforeUnload = () => {
      const call = activeCallRef.current;
      const uid = myUidRef.current;
      if (!call || !uid || !isJoinedRef.current) return;

      const payload = JSON.stringify({ groupId: call.groupId, callId: call.id, uid });
      navigator.sendBeacon("/api/call-leave", new Blob([payload], { type: "application/json" }));
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ── Watch for incoming/active calls in all user groups ───────────────
  useEffect(() => {
    groupCallUnsubsRef.current.forEach((u) => u());
    groupCallUnsubsRef.current = [];

    if (!appUser || groupIds.length === 0) return;

    const unsubs = groupIds.map((groupId) =>
      CallService.watchActiveCall(groupId, (call) => {
        const currentCall = activeCallRef.current;
        if (!call) {
          if (currentCall?.groupId === groupId) handleCallEnded();
          return;
        }

        if (call.status === "ended" || call.status === "cancelled" || call.status === "missed") {
          if (currentCall?.id === call.id) handleCallEnded();
          return;
        }

        // Don't override if already in a different call
        if (currentCall && currentCall.id !== call.id) return;

        setActiveCall(call);
      })
    );

    groupCallUnsubsRef.current = unsubs;
    return () => {
      unsubs.forEach((u) => u());
      groupCallUnsubsRef.current = [];
    };
  }, [appUser?.id, groupIds.join(",")]);

  // ── React to participant changes once joined ──────────────────────────
  useEffect(() => {
    if (!activeCall || !isJoined || !appUser || !peerManagerRef.current) return;

    activeCall.participants.forEach((uid) => {
      if (uid !== appUser.id) {
        peerManagerRef.current!.connectTo(uid);
      }
    });
  }, [activeCall?.participants.join(","), isJoined]);

  // ── Real-time Audio Level Analyzer (Web Audio API) ────────────────────
  useEffect(() => {
    if (!isJoined) {
      if (meterIntervalRef.current) {
        clearInterval(meterIntervalRef.current);
        meterIntervalRef.current = null;
      }
      setLocalAudioLevel(0);
      setRemoteAudioLevels({});
      return;
    }

    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Connect local mic
      if (localStream && !isMuted) {
        try {
          const source = ctx.createMediaStreamSource(localStream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          localAnalyserRef.current = analyser;
        } catch (e) {
          console.warn("[LocalAudioAnalyser]", e);
        }
      } else {
        localAnalyserRef.current = null;
      }

      // Connect remote streams
      Object.entries(remoteStreams).forEach(([uid, stream]) => {
        if (!remoteAnalysersRef.current.has(uid) && stream.getAudioTracks().length > 0) {
          try {
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            remoteAnalysersRef.current.set(uid, analyser);
          } catch (e) {
            console.warn(`[RemoteAudioAnalyser:${uid}]`, e);
          }
        }
      });

      // Periodic meter poll
      if (!meterIntervalRef.current) {
        meterIntervalRef.current = setInterval(() => {
          // Local level
          if (localAnalyserRef.current) {
            const buf = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
            localAnalyserRef.current.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const avg = sum / (buf.length || 1);
            setLocalAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          } else {
            setLocalAudioLevel(0);
          }

          // Remote levels
          const remotes: Record<string, number> = {};
          remoteAnalysersRef.current.forEach((analyser, uid) => {
            const buf = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const avg = sum / (buf.length || 1);
            remotes[uid] = Math.min(100, Math.round((avg / 128) * 100));
          });
          setRemoteAudioLevels(remotes);
        }, 120);
      }
    } catch (e) {
      console.warn("[AudioContext setup]", e);
    }

    return () => {
      if (meterIntervalRef.current) {
        clearInterval(meterIntervalRef.current);
        meterIntervalRef.current = null;
      }
    };
  }, [isJoined, localStream, isMuted, remoteStreams]);

  // ── Acquire audio stream with pristine voice constraints ───────────────
  const getMediaStream = useCallback(
    async (deviceId?: string): Promise<MediaStream> => {
      const constraints: MediaStreamConstraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Re-enumerate audio devices now that mic permission is granted
      refreshAudioDevices();
      return stream;
    },
    [refreshAudioDevices]
  );

  // ── Initialise PeerManager after joining ─────────────────────────────
  const initPeerManager = useCallback(
    (call: CallSession, uid: string, stream: MediaStream) => {
      if (peerManagerRef.current) return;

      const pm = new PeerManager(call.groupId, call.id, uid);
      pm.onRemoteStream = (remoteUid, s) => {
        setRemoteStreams((prev) => ({ ...prev, [remoteUid]: s }));
      };
      pm.setLocalStream(stream);
      peerManagerRef.current = pm;

      // Subscribe to incoming signaling
      signalUnsubRef.current = CallService.watchIncomingSignaling(
        call.groupId,
        call.id,
        uid,
        (data) => peerManagerRef.current?.handleIncomingSignaling(data)
      );

      // Connect to existing participants
      call.participants.forEach((p) => {
        if (p !== uid) pm.connectTo(p);
      });
    },
    []
  );

  // ── Clean up everything locally ───────────────────────────────────────
  const handleCallEnded = useCallback(() => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause();
      ringAudioRef.current.currentTime = 0;
    }
    if (ringbackAudioRef.current) {
      ringbackAudioRef.current.pause();
      ringbackAudioRef.current.currentTime = 0;
    }

    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
    localAnalyserRef.current = null;
    remoteAnalysersRef.current.clear();
    setLocalAudioLevel(0);
    setRemoteAudioLevels({});

    sessionUnsubRef.current?.();
    sessionUnsubRef.current = null;
    signalUnsubRef.current?.();
    signalUnsubRef.current = null;

    peerManagerRef.current?.dispose();
    peerManagerRef.current = null;

    setActiveCall(null);
    setIsJoined(false);
    setIsConnecting(false);
    setIsMuted(false);
    setNeedsAudioUnlock(false);
    setRemoteStreams({});
    setLocalStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  // ── Subscribe to a specific call session (used by caller) ────────────
  const subscribeToSession = useCallback(
    (groupId: string, callId: string) => {
      sessionUnsubRef.current?.();
      sessionUnsubRef.current = CallService.watchCallSession(groupId, callId, (call) => {
        if (!call) {
          handleCallEnded();
          return;
        }
        if (call.status === "ended" || call.status === "cancelled") {
          handleCallEnded();
          return;
        }
        setActiveCall(call);
      });
    },
    [handleCallEnded]
  );

  // ── Accept an incoming call ───────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call || !appUser) return;
    setIsConnecting(true);
    try {
      const stream = await getMediaStream(selectedAudioInput || undefined);
      await CallService.joinCall(
        call.groupId,
        call.id,
        appUser.id,
        appUser.displayName || "User",
        appUser.photoUrl || ""
      );
      initPeerManager(call, appUser.id, stream);
      subscribeToSession(call.groupId, call.id);
      setIsJoined(true);
      router.push(`/call/${call.groupId}/${call.id}`);
    } catch (e) {
      console.error("[acceptCall] failed", e);
    } finally {
      setIsConnecting(false);
    }
  }, [appUser, getMediaStream, selectedAudioInput, initPeerManager, subscribeToSession, router]);

  // ── Decline an incoming call ──────────────────────────────────────────
  const declineCall = useCallback(async () => {
    const call = activeCallRef.current;
    const uid = myUidRef.current;

    if (ringAudioRef.current) {
      ringAudioRef.current.pause();
      ringAudioRef.current.currentTime = 0;
    }

    if (call && uid) {
      dismissOngoingCall(call.id);
      CallService.rejectCall(call.groupId, call.id, uid);
    }

    handleCallEnded();
  }, [dismissOngoingCall, handleCallEnded]);

  // ── End an active call ────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    const call = activeCallRef.current;
    const uid = myUidRef.current;
    if (!call || !uid) return;

    handleCallEnded();
    router.push("/dashboard");

    Promise.resolve().then(async () => {
      try {
        if (call.status === "ringing" && call.callerId === uid) {
          await CallService.cancelCall(call.groupId, call.id);
        } else if (call.participants.length <= 1) {
          await CallService.endCall(call.groupId, call.id);
          CallService.cleanupSignaling(call.groupId, call.id);
        } else {
          await CallService.leaveCall(call.groupId, call.id, uid);
        }
      } catch (e) {
        console.error("[endCall] failed", e);
      }
    });
  }, [handleCallEnded, router]);

  // ── Start a new call ──────────────────────────────────────────────────
  const startCall = useCallback(
    async (groupId: string, groupName: string) => {
      if (!appUser) return;
      setIsConnecting(true);
      try {
        const stream = await getMediaStream(selectedAudioInput || undefined);
        const { callId } = await CallService.startCall(
          groupId,
          groupName,
          appUser.id,
          appUser.displayName || "User",
          appUser.photoUrl || ""
        );

        const callDoc = await new Promise<CallSession | null>((resolve) => {
          const unsub = CallService.watchCallSession(groupId, callId, (c) => {
            unsub();
            resolve(c);
          });
        });

        if (!callDoc) return;
        setActiveCall(callDoc);
        initPeerManager(callDoc, appUser.id, stream);
        subscribeToSession(groupId, callId);
        setIsJoined(true);
        router.push(`/call/${groupId}/${callId}`);
      } catch (e) {
        console.error("[startCall] failed", e);
      } finally {
        setIsConnecting(false);
      }
    },
    [appUser, getMediaStream, selectedAudioInput, initPeerManager, subscribeToSession, router]
  );

  // ── Toggle mute ───────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  }, [localStream]);

  // ── Desktop Speaker Mode & Audio Routing ─────────────────────────────
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      setSpeakerVolumeState(next ? 1.0 : 0.75);
      return next;
    });
  }, []);

  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => !prev);
  }, []);

  const setSpeakerVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1.5, vol));
    setSpeakerVolumeState(clamped);
  }, []);

  const setAudioInputDevice = useCallback(
    async (deviceId: string) => {
      setSelectedAudioInput(deviceId);
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 48000 },
          },
        });
        const newTrack = newStream.getAudioTracks()[0];
        if (newTrack) {
          newTrack.enabled = !isMuted;
          if (peerManagerRef.current) {
            await peerManagerRef.current.replaceLocalTrack(newTrack);
          }
          setLocalStream(newStream);
        }
      } catch (e) {
        console.error("[setAudioInputDevice] failed:", e);
      }
    },
    [isMuted]
  );

  const setAudioOutputDevice = useCallback(async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("splinzo_audio_output", deviceId);
      }
    } catch {}
  }, []);

  const unlockAudio = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    if (ringAudioRef.current) {
      ringAudioRef.current.play().catch(() => {});
    }
    setNeedsAudioUnlock(false);
  }, []);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        localStream,
        remoteStreams,
        isRinging,
        isOngoingHover,
        isJoined,
        isConnecting,
        isMuted,
        isSpeakerOn,
        speakerVolume,
        isDeafened,
        selectedAudioInput,
        selectedAudioOutput,
        audioInputs,
        audioOutputs,
        localAudioLevel,
        remoteAudioLevels,
        needsAudioUnlock,
        acceptCall,
        declineCall,
        dismissOngoingCall,
        endCall,
        startCall,
        toggleMute,
        toggleSpeaker,
        toggleDeafen,
        setSpeakerVolume,
        setAudioInputDevice,
        setAudioOutputDevice,
        unlockAudio,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
}
