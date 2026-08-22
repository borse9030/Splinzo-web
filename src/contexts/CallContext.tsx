"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/useGroups";
import { CallSession } from "@/types/call";
import { CallService } from "@/services/callService";
import { PeerManager } from "@/lib/webrtc/PeerManager";

interface CallContextType {
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isRinging: boolean;
  isJoined: boolean;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  startCall: (groupId: string, groupName: string) => Promise<void>;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { appUser } = useAuth();
  const { groups } = useGroups();

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isJoined, setIsJoined] = useState(false);

  const peerManagerRef = useRef<PeerManager | null>(null);
  const signalUnsubRef = useRef<(() => void) | null>(null);
  const groupCallUnsubsRef = useRef<(() => void)[]>([]);
  const sessionUnsubRef = useRef<(() => void) | null>(null);
  const activeCallRef = useRef<CallSession | null>(null); // stable ref for beforeunload
  const isJoinedRef = useRef(false);
  const myUidRef = useRef<string | undefined>(undefined);

  // Keep refs in sync
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { isJoinedRef.current = isJoined; }, [isJoined]);
  useEffect(() => { myUidRef.current = appUser?.id; }, [appUser]);

  // ── Tab / browser close cleanup ──────────────────────────────────────
  useEffect(() => {
    const onBeforeUnload = () => {
      const call = activeCallRef.current;
      const uid = myUidRef.current;
      if (!call || !uid || !isJoinedRef.current) return;

      // sendBeacon is the only API that reliably fires on tab/window close
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

    if (!appUser || groups.length === 0) return;

    const unsubs = groups.map((group) =>
      CallService.watchActiveCall(group.id, (call) => {
        const currentCall = activeCallRef.current;
        if (!call) {
          // No active call in this group
          if (currentCall?.groupId === group.id) {
            handleCallEnded();
          }
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
  }, [appUser?.id, groups.map((g) => g.id).join(",")]);

  // ── React to participant changes once joined ──────────────────────────
  useEffect(() => {
    if (!activeCall || !isJoined || !appUser || !peerManagerRef.current) return;

    activeCall.participants.forEach((uid) => {
      if (uid !== appUser.id) {
        peerManagerRef.current!.connectTo(uid);
      }
    });
  }, [activeCall?.participants.join(","), isJoined]);

  // ── Get microphone stream ─────────────────────────────────────────────
  const getMediaStream = useCallback(async (): Promise<MediaStream> => {
    if (localStream) return localStream;
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    setLocalStream(stream);
    return stream;
  }, [localStream]);

  // ── Initialise PeerManager after joining ─────────────────────────────
  const initPeerManager = useCallback(
    (call: CallSession, uid: string, stream: MediaStream) => {
      if (peerManagerRef.current) return; // already initialised

      const pm = new PeerManager(call.groupId, call.id, uid);
      pm.onRemoteStream = (remoteUid, s) =>
        setRemoteStreams((prev) => ({ ...prev, [remoteUid]: s }));
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
    sessionUnsubRef.current?.();
    sessionUnsubRef.current = null;
    signalUnsubRef.current?.();
    signalUnsubRef.current = null;

    peerManagerRef.current?.dispose();
    peerManagerRef.current = null;

    setActiveCall(null);
    setIsJoined(false);
    setRemoteStreams({});
    setLocalStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  // ── Subscribe to a specific call session (used by caller) ────────────
  const subscribeToSession = useCallback((groupId: string, callId: string) => {
    sessionUnsubRef.current?.();
    sessionUnsubRef.current = CallService.watchCallSession(groupId, callId, (call) => {
      if (!call) { handleCallEnded(); return; }
      if (call.status === "ended" || call.status === "cancelled") {
        handleCallEnded();
        return;
      }
      setActiveCall(call);
    });
  }, [handleCallEnded]);

  // ── Accept an incoming call ───────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call || !appUser) return;
    try {
      const stream = await getMediaStream();
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
    }
  }, [appUser, getMediaStream, initPeerManager, subscribeToSession, router]);

  // ── Decline an incoming call ──────────────────────────────────────────
  const declineCall = useCallback(async () => {
    handleCallEnded();
  }, [handleCallEnded]);

  // ── End an active call ────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    const call = activeCallRef.current;
    const uid = myUidRef.current;
    if (!call || !uid) return;

    if (call.participants.length <= 1) {
      await CallService.endCall(call.groupId, call.id);
      CallService.cleanupSignaling(call.groupId, call.id);
    } else {
      await CallService.leaveCall(call.groupId, call.id, uid);
    }

    handleCallEnded();
    router.back();
  }, [handleCallEnded, router]);

  // ── Start a new call ──────────────────────────────────────────────────
  const startCall = useCallback(
    async (groupId: string, groupName: string) => {
      if (!appUser) return;
      try {
        const stream = await getMediaStream();
        const { callId } = await CallService.startCall(
          groupId,
          groupName,
          appUser.id,
          appUser.displayName || "User",
          appUser.photoUrl || ""
        );

        // Immediately bootstrap the call state
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
      }
    },
    [appUser, getMediaStream, initPeerManager, subscribeToSession, router]
  );

  // ── Toggle mute ───────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    // Force a re-render so mute icon updates
    setLocalStream((prev) => prev);
  }, [localStream]);

  const isRinging =
    activeCall !== null &&
    !isJoined &&
    activeCall.status === "ringing" &&
    activeCall.callerId !== appUser?.id;

  return (
    <CallContext.Provider
      value={{
        activeCall,
        localStream,
        remoteStreams,
        isRinging,
        isJoined,
        acceptCall,
        declineCall,
        endCall,
        startCall,
        toggleMute,
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
