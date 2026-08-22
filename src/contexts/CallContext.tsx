"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();
  const { groups } = useGroups();
  
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isJoined, setIsJoined] = useState(false);
  
  const peerManagerRef = useRef<PeerManager | null>(null);
  const unsubsRef = useRef<Function[]>([]);

  // Watch for active calls in any of the user's groups
  useEffect(() => {
    if (!appUser || groups.length === 0) return;

    const unsubs = groups.map(group => 
      CallService.watchActiveCall(group.id, (call) => {
        if (call) {
          // Prevent overriding if we are already in another active call
          if (!activeCall || activeCall.id === call.id) {
            setActiveCall(call);
            
            // If the call was ended remotely, clean up
            if (call.status === 'ended' || call.status === 'cancelled' || call.status === 'missed') {
              handleCallEnded();
            }
          }
        }
      })
    );

    return () => unsubs.forEach(unsub => unsub());
  }, [appUser, groups]); // activeCall is not in dependency to avoid re-triggering constantly

  // Handle Peer connections when the call is joined
  useEffect(() => {
    if (!activeCall || !isJoined || !appUser) return;

    if (!peerManagerRef.current) {
      peerManagerRef.current = new PeerManager(activeCall.groupId, activeCall.id, appUser.id);
      
      peerManagerRef.current.onRemoteStream = (uid, stream) => {
        setRemoteStreams(prev => ({ ...prev, [uid]: stream }));
      };
      
      if (localStream) {
        peerManagerRef.current.setLocalStream(localStream);
      }

      // Watch for incoming signaling
      const sigUnsub = CallService.watchIncomingSignaling(activeCall.groupId, activeCall.id, appUser.id, (data) => {
        peerManagerRef.current?.handleIncomingSignaling(data);
      });
      unsubsRef.current.push(sigUnsub);
    }

    // Connect to participants who are in the call
    activeCall.participants.forEach(uid => {
      if (uid !== appUser.id) {
        peerManagerRef.current?.createAndSendOffer(uid);
      }
    });

  }, [activeCall?.participants.length, isJoined]); // Trigger when participants change

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error("Error accessing media devices", e);
      throw e;
    }
  };

  const handleCallEnded = () => {
    setActiveCall(null);
    setIsJoined(false);
    setRemoteStreams({});
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    peerManagerRef.current?.dispose();
    peerManagerRef.current = null;
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
  };

  const acceptCall = async () => {
    if (!activeCall || !appUser) return;
    const stream = await getMediaStream();
    await CallService.joinCall(activeCall.groupId, activeCall.id, appUser.id, appUser.displayName || "User", appUser.photoUrl || "");
    setIsJoined(true);
  };

  const declineCall = async () => {
    handleCallEnded();
  };

  const endCall = async () => {
    if (!activeCall || !appUser) return;
    
    // If we are the only one left, end it completely
    if (activeCall.participants.length <= 1) {
      await CallService.endCall(activeCall.groupId, activeCall.id);
    } else {
      await CallService.leaveCall(activeCall.groupId, activeCall.id, appUser.id);
    }
    
    handleCallEnded();
  };

  const startCall = async (groupId: string, groupName: string) => {
    if (!appUser) return;
    
    const stream = await getMediaStream();
    
    const callId = await CallService.startCall(
      groupId,
      groupName,
      appUser.id,
      appUser.displayName || "User",
      appUser.photoUrl || ""
    );
    
    setIsJoined(true);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    }
  };

  const isRinging = activeCall !== null && !isJoined && activeCall.callerId !== appUser?.id;

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
        toggleVideo
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
