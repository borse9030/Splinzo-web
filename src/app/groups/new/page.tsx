"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { groupService } from "@/services/groupService";
// Trigger hot reload for Turbopack
import { motion } from "framer-motion";
import { Camera, ChevronLeft, Loader2, Plane, Home, Heart, Users } from "lucide-react";
import Link from "next/link";

const AMBER = "#F9B912";

const GROUP_TYPES = [
  { id: "trip", label: "Trip", icon: Plane },
  { id: "home", label: "Home", icon: Home },
  { id: "couple", label: "Couple", icon: Heart },
  { id: "other", label: "Other", icon: Users },
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export default function NewGroupPage() {
  const { appUser, user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState("trip");
  const [currency, setCurrency] = useState("INR");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appUser?.defaultCurrency) {
      setCurrency(appUser.defaultCurrency);
    }
  }, [appUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }
    if (!appUser) {
      setError("You must be logged in to create a group.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const groupId = await groupService.createGroup(
        name.trim(),
        type,
        currency,
        imageFile,
        appUser
      );
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create group. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard"
                className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <ChevronLeft className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </Link>
          <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>Create New Group</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-8 shadow-sm"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <form onSubmit={handleCreateGroup} className="space-y-8">
            
            {/* Image Upload */}
            <div className="flex flex-col items-center">
              <div 
                className="relative h-28 w-28 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 overflow-hidden"
                style={{ 
                  background: imagePreview ? "transparent" : "var(--muted)", 
                  border: `2px dashed ${imagePreview ? "transparent" : "var(--border)"}` 
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Group Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Add Icon</span>
                  </div>
                )}
                
                {imagePreview && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center">
                {error}
              </div>
            )}

            {/* Group Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest ml-1" style={{ color: "var(--muted-foreground)" }}>
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Goa Trip 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl text-lg font-bold outline-none transition-all"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "2px solid transparent",
                }}
                onFocus={(e) => e.target.style.borderColor = AMBER}
                onBlur={(e) => e.target.style.borderColor = "transparent"}
                required
              />
            </div>

            {/* Group Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest ml-1" style={{ color: "var(--muted-foreground)" }}>
                Group Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GROUP_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all"
                      style={{
                        background: isSelected ? AMBER : "var(--muted)",
                        color: isSelected ? "#1a1a1a" : "var(--muted-foreground)",
                        boxShadow: isSelected ? `0 4px 12px rgba(249,185,18,0.2)` : "none"
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-bold">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest ml-1" style={{ color: "var(--muted-foreground)" }}>
                Currency
              </label>
              <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "var(--muted)" }}>
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                    style={{
                      background: currency === c ? "var(--card)" : "transparent",
                      color: currency === c ? "var(--foreground)" : "var(--muted-foreground)",
                      boxShadow: currency === c ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                style={{ 
                  background: AMBER, 
                  color: "#1a1a1a",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: `0 8px 24px rgba(249,185,18,0.25)` 
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}
