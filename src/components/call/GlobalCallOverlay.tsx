"use client";

import React from "react";
import { useCall } from "@/contexts/CallContext";
import { Phone, PhoneOff, X, Users } from "lucide-react";

const animationsStyle = `
  @keyframes slideDown {
    from { opacity: 0; transform: translate(-50%, -80%); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
  @keyframes slideDownHover {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
  @keyframes pulseGlow {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.15); opacity: 0.4; }
  }
`;

export function GlobalCallOverlay() {
  const {
    activeCall,
    isRinging,
    isOngoingHover,
    acceptCall,
    declineCall,
    dismissOngoingCall,
  } = useCall();

  if (!activeCall) return null;

  // 1. Loud ringing incoming call modal
  if (isRinging) {
    return (
      <>
        <style>{animationsStyle}</style>
        <div
          className="fixed top-5 left-1/2 z-[150] w-[92%] max-w-sm"
          style={{
            transform: "translateX(-50%)",
            background: "rgba(28,28,30,0.97)",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            animation: "slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div className="p-5 flex flex-col items-center gap-4">
            {/* Caller avatar */}
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg"
              style={{ border: "4px solid rgba(249,185,18,0.4)" }}
            >
              {activeCall.participantPhotos?.[activeCall.callerId] ? (
                <img
                  src={activeCall.participantPhotos[activeCall.callerId]}
                  alt="Caller"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#F9B912]/20 flex items-center justify-center">
                  <Phone className="w-9 h-9 text-[#F9B912]" />
                </div>
              )}
              <span
                className="absolute inset-0 rounded-full pointer-events-none animate-ping"
                style={{ border: "3px solid rgba(249,185,18,0.3)" }}
              />
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">
                Incoming Voice Call
              </p>
              <h3 className="text-white text-xl font-bold">{activeCall.groupName}</h3>
              <p className="text-white/50 text-sm mt-0.5">
                {activeCall.participantNames?.[activeCall.callerId] || "Someone"} is calling…
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-8 mt-1">
              <div className="flex flex-col items-center gap-2">
                <button
                  id="call-decline-btn"
                  onClick={declineCall}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 active:scale-90 transition-all shadow-lg cursor-pointer"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
                <span className="text-white/40 text-xs">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  id="call-accept-btn"
                  onClick={acceptCall}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 active:scale-90 transition-all shadow-lg cursor-pointer"
                  style={{ boxShadow: "0 0 20px rgba(34,197,94,0.4)" }}
                >
                  <Phone className="w-6 h-6 text-white" />
                </button>
                <span className="text-white/40 text-xs">Accept</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 2. Non-intrusive floating hover notification for ongoing calls
  if (isOngoingHover) {
    const participantCount = activeCall.participants?.length || 1;

    return (
      <>
        <style>{animationsStyle}</style>
        <div
          id="ongoing-call-hover-pill"
          className="fixed top-4 left-1/2 z-[140] w-[94%] max-w-md"
          style={{
            transform: "translateX(-50%)",
            animation: "slideDownHover 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="px-4 py-3 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-xl shadow-2xl transition-all"
            style={{
              background: "rgba(24, 24, 27, 0.95)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 197, 94, 0.15)",
            }}
          >
            {/* Pulsing indicator & Call Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    Call in Progress
                  </span>
                  <span className="text-white/30 text-xs">•</span>
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <Users className="w-3 h-3 text-white/50" />
                    {participantCount} active
                  </span>
                </div>
                <h4 className="text-white text-sm font-semibold truncate mt-0.5">
                  {activeCall.groupName}
                </h4>
              </div>
            </div>

            {/* Action buttons: Join & Dismiss */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                id="join-ongoing-call-btn"
                onClick={acceptCall}
                className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                style={{ boxShadow: "0 0 12px rgba(34,197,94,0.35)" }}
              >
                <span>Join</span>
              </button>

              <button
                id="dismiss-ongoing-call-btn"
                onClick={() => dismissOngoingCall(activeCall.id)}
                title="Dismiss notification"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}

