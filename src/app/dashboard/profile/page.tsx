"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { appUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(appUser?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !auth.currentUser) return;
    
    setSaving(true);
    setMessage(null);

    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      // 2. Update Firestore Document
      const userRef = doc(db, "users", appUser.id);
      await updateDoc(userRef, {
        displayName: name,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (!appUser) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-gray-500">Manage your Splinzo account</p>
      </header>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <div className="h-2 w-full bg-primary" />
        <CardHeader className="pb-4">
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your display name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="h-24 w-24 border-4 border-gray-50 shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appUser.id}`} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1 w-full">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={appUser.email}
                disabled
                className="rounded-xl h-11 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500">Email cannot be changed directly.</p>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
              }`}>
                {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            <div className="flex justify-end border-t pt-6 mt-6">
              <Button type="submit" disabled={saving || name === appUser.displayName} className="rounded-xl px-8 h-11">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-100 shadow-sm rounded-2xl overflow-hidden bg-red-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-bold text-red-600">Danger Zone</h3>
              <p className="text-sm text-red-500/80">Log out of this device or delete your account entirely.</p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="rounded-xl h-11 px-6 w-full sm:w-auto">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
