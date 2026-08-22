"use client";

import React from "react";
import { useCall } from "@/contexts/CallContext";
import { Phone, PhoneOff } from "lucide-react";

const slideDownStyle = `
  @keyframes slideDown {
    from { opacity: 0; transform: translate(-50%, -80%); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
`;

export function GlobalCallOverlay() {
  const { activeCall, isRinging, acceptCall, declineCall } = useCall();

  if (!isRinging || !activeCall) return null;

  return (
    <>
      <style>{slideDownStyle}</style>
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
          <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg"
               style={{ border: "4px solid rgba(249,185,18,0.4)" }}>
            {activeCall.participantPhotos[activeCall.callerId] ? (
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
            {/* Pulsing ring */}
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
              {activeCall.participantNames[activeCall.callerId] || "Someone"} is calling…
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-8 mt-1">
            <div className="flex flex-col items-center gap-2">
              <button
                id="call-decline-btn"
                onClick={declineCall}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 active:scale-90 transition-all shadow-lg"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <span className="text-white/40 text-xs">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                id="call-accept-btn"
                onClick={acceptCall}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 active:scale-90 transition-all shadow-lg"
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
