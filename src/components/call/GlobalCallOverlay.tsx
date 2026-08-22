"use client";

import React from "react";
import { useCall } from "@/contexts/CallContext";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalCallOverlay() {
  const {
    activeCall,
    isRinging,
    isJoined,
    localStream,
    remoteStreams,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  if (!activeCall) return null;

  return (
    <AnimatePresence>
      {isRinging && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1C1C1E] text-white p-5 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-white/10 w-[90%] max-w-sm"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
            {activeCall.participantPhotos[activeCall.callerId] ? (
              <img src={activeCall.participantPhotos[activeCall.callerId]} alt="Caller" className="w-full h-full object-cover" />
            ) : (
              <Phone className="w-8 h-8 text-[#F9B912]" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg">{activeCall.groupName}</h3>
            <p className="text-sm text-gray-400">Incoming video call...</p>
          </div>
          <div className="flex gap-6 w-full justify-center mt-2">
            <button
              onClick={declineCall}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
            <button
              onClick={acceptCall}
              className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors animate-pulse"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {isJoined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2 auto-rows-fr">
            {/* Local Stream */}
            {localStream && (
              <div className="relative rounded-2xl overflow-hidden bg-[#111]">
                <VideoPlayer stream={localStream} isLocal={true} />
                <div className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-md">
                  You
                </div>
              </div>
            )}
            
            {/* Remote Streams */}
            {Object.entries(remoteStreams).map(([uid, stream]) => (
              <div key={uid} className="relative rounded-2xl overflow-hidden bg-[#111]">
                <VideoPlayer stream={stream} />
                <div className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-md">
                  {activeCall.participantNames[uid] || "Participant"}
                </div>
              </div>
            ))}
            
            {/* Loading placeholders for participants who joined but haven't sent video yet */}
            {activeCall.participants.map(uid => {
              if (uid === activeCall.callerId) return null; // We are local
              if (remoteStreams[uid]) return null;
              
              return (
                <div key={uid + 'loading'} className="relative rounded-2xl bg-[#111] flex flex-col items-center justify-center border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse mb-4" />
                  <p className="text-gray-500 text-sm animate-pulse">Connecting...</p>
                </div>
              );
            })}
          </div>

          <div className="h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6 pb-6">
            <button
              onClick={toggleMute}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white backdrop-blur-lg"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={toggleVideo}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white backdrop-blur-lg"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
