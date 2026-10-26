"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Sparkles,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Radio,
  Send,
  Eye,
} from "lucide-react";

interface AppUpdateConfig {
  latestVersionCode: number;
  latestVersionName: string;
  minSupportedVersionCode: number;
  title: string;
  message: string;
  releaseNotes: string[];
  isForceUpdate: boolean;
  playStoreUrl: string;
  webPlayStoreUrl: string;
  enabled: boolean;
  updatedAt?: any;
}

const DEFAULT_CONFIG: AppUpdateConfig = {
  latestVersionCode: 44,
  latestVersionName: "1.0.41",
  minSupportedVersionCode: 1,
  title: "New Update Available! 🚀",
  message: "A newer version of Splinzo is available on Google Play with new features and performance enhancements.",
  releaseNotes: [
    "Seamless Google sign-in & sign-up on all browsers",
    "Dedicated mobile number uniqueness security",
    "Faster contact split & transaction synchronization",
  ],
  isForceUpdate: false,
  playStoreUrl: "market://details?id=com.splinzo.splinzo",
  webPlayStoreUrl: "https://play.google.com/store/apps/details?id=com.splinzo.splinzo",
  enabled: true,
};

export default function AdminAppUpdatesPage() {
  const [config, setConfig] = useState<AppUpdateConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const ref = doc(db, "app_config", "app_updates");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as AppUpdateConfig;
          setConfig({
            latestVersionCode: data.latestVersionCode ?? 41,
            latestVersionName: data.latestVersionName || "1.0.38",
            minSupportedVersionCode: data.minSupportedVersionCode ?? 40,
            title: data.title || "New Update Available! 🚀",
            message: data.message || "",
            releaseNotes: Array.isArray(data.releaseNotes) ? data.releaseNotes : [],
            isForceUpdate: Boolean(data.isForceUpdate),
            playStoreUrl: data.playStoreUrl || "market://details?id=com.splinzo.splinzo",
            webPlayStoreUrl: data.webPlayStoreUrl || "https://play.google.com/store/apps/details?id=com.splinzo.splinzo",
            enabled: data.enabled !== false,
          });
        }
      } catch (err: any) {
        console.error("Error loading update config:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const ref = doc(db, "app_config", "app_updates");
      await setDoc(
        ref,
        {
          ...config,
          latestVersionCode: Number(config.latestVersionCode),
          minSupportedVersionCode: Number(config.minSupportedVersionCode),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStatusMessage({
        type: "success",
        text: `App update configuration saved! Users on Build < ${config.latestVersionCode} will now receive update prompts.`,
      });
    } catch (err: any) {
      console.error("Error saving update config:", err);
      setStatusMessage({ type: "error", text: err?.message || "Failed to save update configuration." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setConfig((prev) => ({
      ...prev,
      releaseNotes: [...prev.releaseNotes, newNote.trim()],
    }));
    setNewNote("");
  };

  const handleRemoveNote = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      releaseNotes: prev.releaseNotes.filter((_, i) => i !== index),
    }));
  };

  const handleBroadcastPush = async () => {
    const confirmed = window.confirm(
      `Broadcast push notification to all users about Splinzo v${config.latestVersionName}?`
    );
    if (!confirmed) return;

    setBroadcasting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Update Available: Splinzo v${config.latestVersionName} 🚀`,
          body: `A new version of Splinzo is available on Google Play Store with performance updates and fixes. Tap to update!`,
          data: {
            type: "app_update",
            version: config.latestVersionName,
            url: config.webPlayStoreUrl,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Broadcast request failed");
      }

      setStatusMessage({
        type: "success",
        text: `Push notification broadcast sent successfully for Splinzo v${config.latestVersionName}!`,
      });
    } catch (err: any) {
      console.error("Broadcast push error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to broadcast update notification.",
      });
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-widest">
              Android Play Store
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse" /> Live Remote Config
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">App Releases & In-App Updates</h1>
          <p className="text-sm text-gray-500 font-medium">
            Control the in-app update dialog, release notes, force updates, and Play Store redirection in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBroadcastPush}
            disabled={broadcasting || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-500" />}
            Broadcast Push Alert
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-semibold ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Master Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Enable Update Prompt</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  When enabled, users on older versions will see the in-app update popup.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Version Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Latest Version Name
                </label>
                <input
                  type="text"
                  value={config.latestVersionName}
                  onChange={(e) => setConfig({ ...config, latestVersionName: e.target.value })}
                  placeholder="1.0.38"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Visible in update prompt</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Latest Version Code
                </label>
                <input
                  type="number"
                  value={config.latestVersionCode}
                  onChange={(e) => setConfig({ ...config, latestVersionCode: Number(e.target.value) })}
                  placeholder="41"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Triggers update if user build &lt; code</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Min Supported Code
                </label>
                <input
                  type="number"
                  value={config.minSupportedVersionCode}
                  onChange={(e) => setConfig({ ...config, minSupportedVersionCode: Number(e.target.value) })}
                  placeholder="40"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Forces update if build &lt; min</span>
              </div>
            </div>

            {/* Force Update Option */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50/70 border border-red-200/80">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-950">Force Update (Cannot Dismiss)</h3>
                  <p className="text-xs text-red-700 mt-0.5">
                    Hides the &quot;Remind Me Later&quot; button and prevents users from using older versions.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isForceUpdate}
                  onChange={(e) => setConfig({ ...config, isForceUpdate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {/* Prompt Title & Message */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Dialog Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="New Update Available! 🚀"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Dialog Message
                </label>
                <textarea
                  value={config.message}
                  onChange={(e) => setConfig({ ...config, message: e.target.value })}
                  rows={3}
                  placeholder="Tell users why they should update..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* What's New Release Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                What&apos;s New / Release Notes
              </label>
              <div className="space-y-2 mb-3">
                {config.releaseNotes.map((note, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800"
                  >
                    <span>• {note}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNote(index)}
                      className="text-gray-400 hover:text-red-600 transition"
                      aria-label="Remove note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  placeholder="Add a new feature or fix note..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Play Store Redirect URLs */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Play Store Market Link (App Scheme)
                </label>
                <input
                  type="text"
                  value={config.playStoreUrl}
                  onChange={(e) => setConfig({ ...config, playStoreUrl: e.target.value })}
                  placeholder="market://details?id=com.splinzo.splinzo"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Web Play Store Fallback Link
                </label>
                <input
                  type="url"
                  value={config.webPlayStoreUrl}
                  onChange={(e) => setConfig({ ...config, webPlayStoreUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=com.splinzo.splinzo"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl font-black text-sm text-gray-950 flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #F9B912 0%, #F9A000 100%)",
                boxShadow: "0 8px 25px -4px rgba(249, 185, 18, 0.45)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Configuration...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save &amp; Publish Update Live
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live In-App Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-amber-500" /> Live In-App Dialog Preview
          </div>

          <div className="bg-slate-900 rounded-[32px] p-6 text-white border border-slate-800 shadow-2xl space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 text-slate-950">
                <Smartphone className="w-8 h-8" />
              </div>

              <h4 className="text-xl font-black tracking-tight">{config.title || "New Update Available! 🚀"}</h4>

              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  New: v{config.latestVersionName || "1.0.38"}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Installed: v1.0.37
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-xs">{config.message}</p>
            </div>

            {config.releaseNotes.length > 0 && (
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" /> What&apos;s New:
                </div>
                {config.releaseNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}

            {config.isForceUpdate && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold text-center">
                This update is required to continue using Splinzo.
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                className="w-full py-3.5 rounded-xl font-black text-sm bg-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20"
              >
                <ExternalLink className="w-4 h-4" /> Update on Play Store
              </button>

              {!config.isForceUpdate && (
                <div className="text-center text-xs font-bold text-slate-400 py-1">Remind Me Later</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
