"use client";

import React, { useState } from "react";
import { useCall } from "@/contexts/CallContext";
import {
  Mic,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  X,
  Play,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioSettingsModal({ isOpen, onClose }: AudioSettingsModalProps) {
  const {
    audioInputs,
    audioOutputs,
    selectedAudioInput,
    selectedAudioOutput,
    setAudioInputDevice,
    setAudioOutputDevice,
    speakerVolume,
    setSpeakerVolume,
    isSpeakerOn,
    toggleSpeaker,
    isDeafened,
    toggleDeafen,
    localAudioLevel,
  } = useCall();

  const [isPlayingTest, setIsPlayingTest] = useState(false);

  if (!isOpen) return null;

  // Plays a short, pleasant test audio chime through the selected speaker
  const playTestSound = () => {
    try {
      setIsPlayingTest(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25 * speakerVolume, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.46);

      setTimeout(() => {
        setIsPlayingTest(false);
      }, 500);
    } catch (e) {
      console.warn("[playTestSound]", e);
      setIsPlayingTest(false);
    }
  };

  const volumePercent = Math.round(speakerVolume * 100);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 text-white shadow-2xl relative border overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(28, 28, 35, 0.98), rgba(18, 18, 22, 0.98))",
          borderColor: "rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Audio & Device Settings</h3>
              <p className="text-white/50 text-xs">Configure desktop speaker & microphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          {/* Microphone Device */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/70">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                Microphone (Input Device)
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-normal lowercase">
                <Sparkles className="w-3 h-3" />
                Noise filtered
              </span>
            </label>
            <select
              value={selectedAudioInput}
              onChange={(e) => setAudioInputDevice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-xs truncate transition-all cursor-pointer"
            >
              {audioInputs.length > 0 ? (
                audioInputs.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId} className="bg-zinc-900 text-white">
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))
              ) : (
                <option value="" className="bg-zinc-900 text-white">Default Microphone</option>
              )}
            </select>

            {/* Mic Live Level Indicator */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                <span>Input Level</span>
                <span className="font-mono text-emerald-400">
                  {localAudioLevel > 10 ? `${localAudioLevel}% (Speaking)` : "Quiet"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  className="h-full transition-all duration-75 rounded-full"
                  style={{
                    width: `${Math.min(100, localAudioLevel * 1.4)}%`,
                    background:
                      localAudioLevel > 65
                        ? "linear-gradient(90deg, #10B981, #F59E0B, #EF4444)"
                        : "linear-gradient(90deg, #10B981, #34D399)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Speaker Device */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Speaker (Output Device)
              </label>
              <button
                onClick={playTestSound}
                disabled={isPlayingTest}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-amber-300 font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                {isPlayingTest ? "Playing..." : "Test Sound"}
              </button>
            </div>

            <select
              value={selectedAudioOutput}
              onChange={(e) => setAudioOutputDevice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-white text-xs truncate transition-all cursor-pointer"
            >
              {audioOutputs.length > 0 ? (
                audioOutputs.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId} className="bg-zinc-900 text-white">
                    {d.label || `Speaker ${i + 1}`}
                  </option>
                ))
              ) : (
                <option value="" className="bg-zinc-900 text-white">Default System Output</option>
              )}
            </select>
          </div>

          {/* Speaker Mode & Volume Slider */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isSpeakerOn ? "text-amber-400" : "text-white/40"}`} />
                <div>
                  <span className="font-semibold text-xs block">Loudspeaker Mode</span>
                  <span className="text-[11px] text-white/50">
                    {isSpeakerOn ? "Boosted for external speakers" : "Standard output volume"}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleSpeaker}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  isSpeakerOn ? "bg-amber-500" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isSpeakerOn ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* Volume Slider (0% - 150%) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Output Volume</span>
                <span className="font-mono font-semibold text-amber-300">
                  {volumePercent}% {volumePercent > 100 && "(Boosted)"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={speakerVolume}
                onChange={(e) => setSpeakerVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/40">
                <span>0% (Mute)</span>
                <span>100% (Standard)</span>
                <span>150% (Max Boost)</span>
              </div>
            </div>

            {/* Deafen (Mute incoming) */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <VolumeX className={`w-4 h-4 ${isDeafened ? "text-red-400" : "text-white/40"}`} />
                <div>
                  <span className="font-semibold text-xs block">Deafen (Mute Incoming Audio)</span>
                  <span className="text-[11px] text-white/50">Silence all incoming voices</span>
                </div>
              </div>
              <button
                onClick={toggleDeafen}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isDeafened
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                {isDeafened ? "Deafened" : "Mute Sound"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
