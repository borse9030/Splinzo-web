"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Bell,
  Smartphone,
  Sparkles,
  Zap,
  Droplets,
  Coins,
  PartyPopper,
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
  Wifi,
  Battery,
} from "lucide-react";

interface DeviceSimulatorProps {
  title: string;
  body: string;
  imageUrl?: string;
  bannerStyle: "blinkit" | "water_duty" | "guilt_jar" | "celebration" | "standard";
  actionType: "home" | "group" | "expense" | "guilt_jar" | "url";
  actionLabel?: string;
}

export function DeviceSimulator({
  title,
  body,
  imageUrl,
  bannerStyle,
  actionType,
  actionLabel,
}: DeviceSimulatorProps) {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [viewMode, setViewMode] = useState<"lockscreen" | "in_app">("lockscreen");

  const displayTitle = title.trim() || "⚡ New Announcement from Splinzo";
  const displayBody =
    body.trim() || "Your flatmate just updated the shared expense. Tap here to review!";

  // Style configurations matching the Flutter app's BlinkitNotificationOverlay
  const getBannerDetails = () => {
    switch (bannerStyle) {
      case "water_duty":
        return {
          gradient: "from-[#0F172A] to-[#0369A1]",
          border: "border-sky-500/40",
          badgeBg: "bg-sky-500/20 text-sky-300",
          badgeText: "⚡ JAL DEVTA CALLING",
          icon: Droplets,
          accent: "#38BDF8",
        };
      case "guilt_jar":
        return {
          gradient: "from-[#0F172A] to-[#7F1D1D]",
          border: "border-amber-500/40",
          badgeBg: "bg-amber-500/20 text-amber-300",
          badgeText: "🍯 CHALAN ALERT",
          icon: Coins,
          accent: "#F59E0B",
        };
      case "celebration":
        return {
          gradient: "from-[#0F172A] to-[#4C1D95]",
          border: "border-purple-500/40",
          badgeBg: "bg-purple-500/20 text-purple-300",
          badgeText: "🎉 SPECIAL CELEBRATION",
          icon: PartyPopper,
          accent: "#C084FC",
        };
      default:
        return {
          gradient: "from-[#0F172A] to-[#1E293B]",
          border: "border-amber-500/40",
          badgeBg: "bg-amber-500/20 text-amber-400",
          badgeText: "⚡ BLINKIT FAST NUDGE",
          icon: Zap,
          accent: "#F9B912",
        };
    }
  };

  const bannerDetails = getBannerDetails();
  const BannerIcon = bannerDetails.icon;

  return (
    <div className="flex flex-col items-center">
      {/* Controls Bar */}
      <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 text-xs font-semibold">
        <div className="flex bg-white rounded-xl shadow-xs p-0.5 border border-gray-200">
          <button
            type="button"
            onClick={() => setPlatform("ios")}
            className={`px-3 py-1 rounded-lg transition-all ${
              platform === "ios"
                ? "bg-gray-900 text-white shadow-xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
             iOS
          </button>
          <button
            type="button"
            onClick={() => setPlatform("android")}
            className={`px-3 py-1 rounded-lg transition-all ${
              platform === "android"
                ? "bg-gray-900 text-white shadow-xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🤖 Android
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <div className="flex bg-white rounded-xl shadow-xs p-0.5 border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode("lockscreen")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "lockscreen"
                ? "bg-[#F9B912] text-gray-950 font-bold shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Lockscreen
          </button>
          <button
            type="button"
            onClick={() => setViewMode("in_app")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "in_app"
                ? "bg-[#F9B912] text-gray-950 font-bold shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            In-App Banner
          </button>
        </div>
      </div>

      {/* Phone Hardware Mockup */}
      <div className="relative w-[320px] h-[640px] bg-black rounded-[48px] p-3 shadow-2xl ring-1 ring-gray-900/10 shadow-black/25">
        {/* Outer Silver Bezel highlight */}
        <div className="absolute inset-0 rounded-[48px] border-2 border-gray-700/40 pointer-events-none" />

        {/* Screen Frame */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-slate-900 flex flex-col justify-between select-none">
          {/* Wallpaper Background */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage:
                viewMode === "lockscreen"
                  ? "radial-gradient(ellipse at top, #1e293b, #0f172a 70%, #020617)"
                  : "linear-gradient(to bottom, #F9F7F2, #FFFFFF)",
            }}
          />

          {/* ── STATUS BAR ── */}
          <div className="relative z-20 flex items-center justify-between px-6 pt-3 text-[11px] font-bold">
            <span
              className={
                viewMode === "lockscreen" ? "text-white" : "text-gray-900"
              }
            >
              9:41
            </span>

            {/* Dynamic Island / Android Punch-hole */}
            {platform === "ios" ? (
              <div className="h-5 w-24 bg-black rounded-full shadow-inner flex items-center justify-between px-2">
                <div className="h-2 w-2 rounded-full bg-slate-900" />
                <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
              </div>
            ) : (
              <div className="h-3.5 w-3.5 rounded-full bg-black mx-auto" />
            )}

            <div
              className={`flex items-center gap-1.5 ${
                viewMode === "lockscreen" ? "text-white" : "text-gray-900"
              }`}
            >
              <Wifi size={12} />
              <Battery size={13} />
            </div>
          </div>

          {/* ── LOCKSCREEN VIEW ── */}
          {viewMode === "lockscreen" && (
            <div className="relative z-10 flex-1 flex flex-col justify-between pt-6 pb-6 px-4">
              {/* Clock and Date */}
              <div className="text-center text-white/90">
                <div className="text-[12px] font-medium tracking-wide text-white/70">
                  Saturday, September 26
                </div>
                <div className="text-6xl font-light tracking-tighter text-white font-sans mt-0.5">
                  09:41
                </div>
              </div>

              {/* Notification Cards Area */}
              <div className="my-auto space-y-2">
                <div className="backdrop-blur-xl bg-white/15 border border-white/20 rounded-3xl p-3.5 text-white shadow-xl hover:bg-white/20 transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-lg bg-[#F9B912] flex items-center justify-center text-gray-950 font-black text-[10px] shadow-xs">
                        S
                      </div>
                      <span className="text-[11px] font-bold tracking-tight text-white/95 uppercase font-mono">
                        Splinzo
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60">now</span>
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white tracking-tight leading-snug">
                      {displayTitle}
                    </h4>
                    <p className="text-[11px] text-white/80 line-clamp-3 leading-relaxed">
                      {displayBody}
                    </p>
                  </div>

                  {/* Hero Image if attached */}
                  {imageUrl && imageUrl.trim().startsWith("http") && (
                    <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10 h-28 relative bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Notification Banner"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Action Badge */}
                  {actionType !== "home" && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-semibold text-amber-300">
                      <span className="capitalize">
                        Action: {actionType.replace("_", " ")}
                      </span>
                      <ChevronRight size={12} />
                    </div>
                  )}
                </div>
              </div>

              {/* Lockscreen Bottom Icons */}
              <div className="flex items-center justify-between px-3 text-white/70">
                <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <div className="h-1 w-28 bg-white/40 rounded-full mx-auto" />
                <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <Bell size={14} />
                </div>
              </div>
            </div>
          )}

          {/* ── IN-APP BLINKIT BANNER VIEW ── */}
          {viewMode === "in_app" && (
            <div className="relative z-10 flex-1 flex flex-col justify-between px-3 pb-4 pt-1">
              {/* Animated Heads-Up Banner */}
              <div
                className={`w-full rounded-2xl bg-gradient-to-r ${bannerDetails.gradient} border ${bannerDetails.border} p-3 text-white shadow-2xl`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: `${bannerDetails.accent}20` }}
                  >
                    <BannerIcon size={16} style={{ color: bannerDetails.accent }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md ${bannerDetails.badgeBg}`}
                      >
                        {bannerDetails.badgeText}
                      </span>
                      <span className="text-[9px] text-gray-400 ml-auto">Just now</span>
                    </div>

                    <h4 className="text-xs font-bold text-white tracking-tight truncate">
                      {displayTitle}
                    </h4>
                    <p className="text-[10px] text-gray-300 line-clamp-2 mt-0.5 leading-snug">
                      {displayBody}
                    </p>
                  </div>
                </div>

                {/* Banner Thumbnail */}
                {imageUrl && imageUrl.trim().startsWith("http") && (
                  <div className="mt-2 rounded-lg overflow-hidden h-20 relative bg-black/30 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* In-App Mockup Content Behind */}
              <div className="mt-4 flex-1 rounded-2xl bg-white/70 border border-gray-200/80 p-3 shadow-inner flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-16 w-full bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-amber-800 font-bold">Flat HQ Balance</div>
                      <div className="text-sm font-black text-gray-900">₹ 3,420.00</div>
                    </div>
                    <div className="h-6 w-16 bg-[#F9B912] rounded-lg" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="h-8 w-full bg-gray-100 rounded-lg" />
                    <div className="h-8 w-full bg-gray-100 rounded-lg" />
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-400 font-mono">
                  Splinzo In-App View
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="h-1 w-24 bg-gray-400 rounded-full mx-auto mt-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
