"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/useGroups";
import { auth, db } from "@/lib/firebase/config";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Camera,
  Trash2,
  Loader2,
  User as UserIcon,
  Phone,
  Quote,
  Mail,
  ShieldCheck,
  Wallet,
  Users,
  Check,
} from "lucide-react";
import { storageService } from "@/services/storageService";

export default function ProfilePage() {
  const { appUser, refreshUser } = useAuth();
  const { groups } = useGroups();
  const router = useRouter();

  const [name, setName] = useState(appUser?.displayName || appUser?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(appUser?.phoneNumber || appUser?.phone || "");
  const [upiId, setUpiId] = useState(appUser?.upiId || "");
  const [bio, setBio] = useState(appUser?.bio || "");
  const [photoUrl, setPhotoUrl] = useState(appUser?.photoUrl || appUser?.photoURL || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Sync state when appUser loads/updates
  useEffect(() => {
    if (appUser) {
      setName(appUser.displayName || appUser.name || "");
      setPhoneNumber(appUser.phoneNumber || appUser.phone || "");
      setUpiId(appUser.upiId || "");
      setBio(appUser.bio || "");
      setPhotoUrl(appUser.photoUrl || appUser.photoURL || "");
    }
  }, [appUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic") && !file.name.toLowerCase().endsWith(".heif")) {
      setMessage({ type: "error", text: "Please select an image file (JPEG, PNG, WebP, HEIC)." });
      return;
    }

    setPhotoUploading(true);
    setMessage(null);

    try {
      const url = await storageService.uploadFile(file);
      setPhotoUrl(url);

      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: url,
        });
      }

      // 2. Update Firestore Document
      if (appUser) {
        const userRef = doc(db, "users", appUser.id);
        await updateDoc(userRef, {
          photoUrl: url,
          photoURL: url,
          updatedAt: serverTimestamp(),
        });
      }

      await refreshUser();
      setMessage({ type: "success", text: "Profile picture updated successfully!" });
    } catch (err: any) {
      console.error("Failed to upload profile photo:", err);
      setMessage({ type: "error", text: err.message || "Failed to upload profile picture." });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!appUser) return;
    setPhotoUploading(true);
    setMessage(null);

    try {
      setPhotoUrl("");

      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: "",
        });
      }

      // 2. Update Firestore Document
      const userRef = doc(db, "users", appUser.id);
      await updateDoc(userRef, {
        photoUrl: "",
        photoURL: "",
        updatedAt: serverTimestamp(),
      });

      await refreshUser();
      setMessage({ type: "success", text: "Profile picture removed." });
    } catch (err: any) {
      console.error("Failed to remove profile photo:", err);
      setMessage({ type: "error", text: "Failed to remove profile picture." });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !auth.currentUser) return;

    if (!name.trim()) {
      setMessage({ type: "error", text: "Please enter your full name." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
        photoURL: photoUrl || null,
      });

      // 2. Update Firestore Document
      const userRef = doc(db, "users", appUser.id);
      await updateDoc(userRef, {
        name: name.trim(),
        displayName: name.trim(),
        phoneNumber: phoneNumber.trim(),
        phone: phoneNumber.trim(),
        upiId: upiId.trim(),
        bio: bio.trim(),
        photoUrl: photoUrl || "",
        photoURL: photoUrl || "",
        updatedAt: serverTimestamp(),
      });

      await refreshUser();
      setMessage({ type: "success", text: "Profile updated successfully! 🎉" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (!appUser) return null;

  const currentPhoto = photoUrl || appUser.photoUrl || appUser.photoURL;
  const isDirty =
    name !== (appUser.displayName || appUser.name || "") ||
    phoneNumber !== (appUser.phoneNumber || appUser.phone || "") ||
    upiId !== (appUser.upiId || "") ||
    bio !== (appUser.bio || "") ||
    photoUrl !== (appUser.photoUrl || appUser.photoURL || "");

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your personal information, settlements & Splinzo identity.</p>
      </div>

      {/* ── HERO OVERVIEW CARD ──────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card">
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with Camera badge */}
            <div className="relative group shrink-0">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-amber-100 dark:ring-amber-950/40 shadow-md">
                <AvatarImage src={currentPhoto} className="object-cover" />
                <AvatarFallback className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-extrabold text-3xl">
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>

              {/* Upload Hover Overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              >
                {photoUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </>
                )}
              </label>

              {/* Camera Badge at Bottom Right */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg border-2 border-white dark:border-gray-900 cursor-pointer transition-transform active:scale-95 z-20"
                title="Upload profile picture"
              >
                <Camera className="h-4 w-4" />
              </label>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
              />
            </div>

            {/* Profile Overview Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                    {name || "Splinzo User"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{appUser.email}</p>
                </div>

                {/* Photo Action Buttons */}
                <div className="flex items-center justify-center sm:justify-end gap-2 pt-1">
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {photoUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </>
                    )}
                  </label>

                  {currentPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={photoUploading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Bio Tagline Chip */}
              {bio && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200/60 dark:border-amber-800/40 italic">
                  <Quote className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>{bio}</span>
                </div>
              )}

              {/* Badges Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Users className="h-3.5 w-3.5 text-amber-500" />
                  <span>{groups.length} Groups</span>
                </div>

                {upiId ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>UPI: {upiId}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span>No UPI Configured</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── EDIT FORM ───────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg font-bold text-gray-950 dark:text-white">Edit Profile Details</CardTitle>
          <CardDescription>Update your personal information, phone number, and settlement preferences.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Warning if UPI is not configured */}
          {!upiId.trim() && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  UPI ID Not Configured
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                  Add your UPI ID below so group members can settle debts with you directly. Without a UPI ID, automated settlements to your bank account cannot be initiated.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-amber-500" />
                Personal Details
              </h3>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Full Name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="rounded-xl h-12 pl-10 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="rounded-xl h-12 pl-10 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:border-amber-500"
                  />
                </div>
                <p className="text-xs text-gray-400">Used for group notifications and contact identification.</p>
              </div>

              {/* Bio / Tagline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Bio / Status
                  </Label>
                  <span className="text-[11px] text-gray-400 font-medium">{bio.length}/120</span>
                </div>
                <div className="relative">
                  <Quote className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                  <Input
                    id="bio"
                    maxLength={120}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Always splitting 50-50 🍕"
                    className="rounded-xl h-12 pl-10 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payments / UPI */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-indigo-500" />
                Payment & Settlements
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="upiId" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    UPI ID (Virtual Payment Address)
                  </Label>
                  {!upiId.trim() && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50">
                      Missing
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                  <Input
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                    className="rounded-xl h-12 pl-10 pr-16 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:border-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-wider">
                    UPI
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Required so friends can pay their shares directly into your bank via UPI intent.
                </p>
              </div>
            </div>

            {/* Section 3: Account Email (Read-Only) */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Account Security
              </h3>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200">{appUser.email}</p>
                    <p className="text-[11px] text-gray-400">Linked via Google / Firebase Authentication</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <Check className="h-3 w-3" />
                  <span>Verified</span>
                </div>
              </div>
            </div>

            {/* Alert Message */}
            {message && (
              <div
                className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${
                  message.type === "error"
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}
              >
                {message.type === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="submit"
                disabled={saving || !isDirty}
                className="rounded-xl px-8 h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── DANGER ZONE ─────────────────────────────────────────── */}
      <Card className="border border-red-100 dark:border-red-950/60 shadow-sm rounded-3xl overflow-hidden bg-red-50/30 dark:bg-red-950/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-bold text-red-600 dark:text-red-400">Account Session</h3>
              <p className="text-xs text-red-500/80 mt-0.5">Safely log out of your Splinzo session on this web browser.</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="rounded-xl h-11 px-6 w-full sm:w-auto font-bold shadow-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
