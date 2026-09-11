"use client";

import { useState } from "react";
import { StaffDepartment, DEPARTMENT_LABELS } from "@/types/staff";
import { staffService } from "@/services/staffService";
import {
  X,
  UserPlus,
  Key,
  Mail,
  Shield,
  Briefcase,
  Sparkles,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AMBER = "#F9B912";

function generateRandomPassword(): string {
  const words = ["Splinzo", "Staff", "Agent", "Team", "Secure"];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${randomWord}@${randomNum}`;
}

export function CreateStaffModal({ isOpen, onClose, onSuccess }: CreateStaffModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<StaffDepartment>("all");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    pass: string;
    dept: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username.trim() || !name.trim() || !password.trim()) {
        throw new Error("Please complete all required fields.");
      }

      await staffService.createStaffMember({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase() || `${username.trim().toLowerCase()}@splinzo.in`,
        password: password.trim(),
        department,
      });

      setCreatedCredentials({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        pass: password.trim(),
        dept: DEPARTMENT_LABELS[department],
      });

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create staff member.");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = `🎉 Splinzo Support Staff Access Details:\nName: ${createdCredentials.name}\nDepartment: ${createdCredentials.dept}\nStaff ID / Username: ${createdCredentials.username}\nPassword: ${createdCredentials.pass}\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetAndClose = () => {
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setDepartment("all");
    setCreatedCredentials(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-gray-900 space-y-5"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Create Staff ID & Credentials</h2>
              <p className="text-xs text-gray-500">Assign roles, department queues, and secret credentials.</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Card (shown after creation) */}
        {createdCredentials ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <div>
                <strong>Staff Member Created Successfully!</strong>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Share these credentials with the team member. They can log in directly on the standard login page.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Staff Name:</span>
                <span className="text-gray-900 font-bold">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Department:</span>
                <span className="text-amber-800 font-bold">{createdCredentials.dept}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Staff ID / Username:</span>
                <span className="text-amber-800 font-bold">{createdCredentials.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Secret Password:</span>
                <span className="text-gray-900 font-bold">{createdCredentials.pass}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={copyCredentialsText}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-xs"
                style={{ background: AMBER, color: "#111827" }}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? "Copied to Clipboard!" : "Copy Staff Credentials"}
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-3 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Staff ID / Username */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Staff ID / Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul_support"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-mono outline-none focus:border-amber-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Official Email
              </label>
              <input
                type="email"
                placeholder="e.g. rahul@splinzo.in (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white transition-colors"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Assigned Department Queue *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white transition-colors cursor-pointer"
              >
                {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-white text-gray-900">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Staff Password *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  Auto-Generate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Set password for staff login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs font-mono outline-none focus:border-amber-400 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-black text-xs transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 shadow-xs"
                style={{ background: AMBER, color: "#111827" }}
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ) : (
                  <>
                    <UserPlus size={15} />
                    Create Staff Account
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
