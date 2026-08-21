"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Moon,
  Globe,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Lock,
  Loader2
} from "lucide-react";

const AMBER = "#F9B912";
const AMBER_DARK = "#F9A000";

/* ─── Custom Toggle Switch ──────────────────────────────── */
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none"
      style={{ background: enabled ? AMBER : "#E5E7EB" }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ─── Settings Row Component ────────────────────────────── */
function SettingsRow({
  icon: Icon,
  title,
  description,
  rightElement,
  danger = false
}: {
  icon: any;
  title: string;
  description: string;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-4 sm:px-6 transition-colors group"
         style={{ background: "transparent" }}>
      <div className="flex items-center gap-4">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            danger ? "bg-red-50" : "bg-gray-100"
          }`}
          style={!danger ? { background: "rgba(249,185,18,0.1)" } : {}}
        >
          <Icon className="h-5 w-5" style={{ color: danger ? "#EF4444" : AMBER_DARK }} />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${danger ? "text-red-600" : "text-[color:var(--foreground)]"}`}>
            {title}
          </h3>
          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0">{rightElement}</div>
    </div>
  );
}

/* ─── Main Settings Page ────────────────────────────────── */
export default function SettingsPage() {
  const { user, appUser } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Mock states for UI toggles
  const [currency, setCurrency] = useState("INR");
  const [savingCurrency, setSavingCurrency] = useState(false);
  // Password Change States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Sync currency with user profile on mount
  useEffect(() => {
    if (appUser?.defaultCurrency) {
      setCurrency(appUser.defaultCurrency);
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

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    if (!appUser) return;
    setSavingCurrency(true);
    try {
      const userRef = doc(db, "users", appUser.id);
      await updateDoc(userRef, { defaultCurrency: newCurrency });
    } catch (err) {
      console.error("Failed to update currency", err);
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setPasswordError("");
    setPasswordSuccess(false);
    
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // 2. Update password
      await updatePassword(user, newPassword);
      
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      
      // Auto-collapse after 2 seconds
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setPasswordError("Incorrect current password.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-3xl mx-auto space-y-6 pb-10"
    >
      {/* Header */}
      <motion.header variants={fadeUp} className="pt-2">
        <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>Preferences</p>
        <h1 className="text-3xl font-black tracking-tight relative inline-block" style={{ color: "var(--foreground)" }}>
          Settings
          <span
            className="absolute -bottom-1 left-0 h-1 rounded-full"
            style={{ width: "40px", background: `linear-gradient(90deg, ${AMBER}, ${AMBER_DARK})` }}
          />
        </h1>
      </motion.header>

      {/* Preferences Block */}
      <motion.div variants={fadeUp} className="rounded-3xl overflow-hidden shadow-sm"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
          <h2 className="font-black" style={{ color: "var(--foreground)" }}>App Preferences</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SettingsRow
            icon={Globe}
            title="Default Currency"
            description="Used when creating new groups or expenses."
            rightElement={
              <div className="flex items-center gap-2">
                {savingCurrency && <span className="text-[10px] text-gray-400">Saving...</span>}
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="border-none text-sm font-bold rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-amber-300"
                  style={{ background: "var(--muted)", color: "var(--foreground)" }}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            }
          />
          <SettingsRow
            icon={Moon}
            title="Dark Theme"
            description="Switch to a darker appearance."
            rightElement={
              <Toggle 
                enabled={theme === "dark"} 
                onChange={(enabled) => setTheme(enabled ? "dark" : "light")} 
              />
            }
          />
        </div>
      </motion.div>



      {/* Security & Danger Block */}
      <motion.div variants={fadeUp} className="rounded-3xl overflow-hidden shadow-sm"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
          <h2 className="font-black" style={{ color: "var(--foreground)" }}>Account Security</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <div className="group transition-colors">
            <div
              className="flex items-center justify-between py-4 px-4 sm:px-6 cursor-pointer"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                     style={{ background: "rgba(0,0,0,0.05)" }}>
                  <Shield className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Change Password</h3>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--muted-foreground)" }}>Update your account password.</p>
                </div>
              </div>
              {isChangingPassword ? (
                <ChevronDown className="h-5 w-5 opacity-60" style={{ color: "var(--foreground)" }} />
              ) : (
                <ChevronRight className="h-5 w-5 group-hover:opacity-100 opacity-60" style={{ color: "var(--foreground)" }} />
              )}
            </div>

            {/* Password Form Expansion */}
            {isChangingPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="px-4 sm:px-6 pb-6 pt-2"
              >
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm ml-14">
                  {passwordError && (
                    <div className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="text-xs font-bold text-emerald-500 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      Password updated successfully!
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="h-9 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all w-full"
                      style={{ background: AMBER, color: "#1a1a1a", opacity: passwordLoading ? 0.7 : 1 }}
                    >
                      {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Password"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          <div className="p-4 sm:p-6 bg-red-50/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-red-600">Danger Zone</h3>
                  <p className="text-xs font-medium text-red-500/80 mt-0.5">
                    Log out of this device.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-red-200 text-red-600 shadow-sm hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
