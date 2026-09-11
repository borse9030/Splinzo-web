"use client";

import { useState, useEffect } from "react";
import { StaffMember } from "@/types/staff";
import { staffService } from "@/services/staffService";
import { DEFAULT_ADMIN_SECRET_KEY, ADMIN_USERNAME } from "@/lib/adminAuth";
import { CreateStaffModal } from "./create-staff-modal";
import {
  Users,
  UserPlus,
  Key,
  Lock,
  Copy,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const AMBER = "#F9B912";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Reset password state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  useEffect(() => {
    const unsub = staffService.subscribeToAllStaff((staff) => {
      setStaffList(staff);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggleStatus = async (staff: StaffMember) => {
    try {
      await staffService.updateStaffStatus(staff.id, !staff.isActive);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove staff member "${name}"?`)) {
      try {
        await staffService.deleteStaffMember(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSavePassword = async (id: string) => {
    if (!newPasswordInput.trim()) return;
    try {
      await staffService.updateStaffPassword(id, newPasswordInput.trim());
      setEditingStaffId(null);
      setNewPasswordInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyStaffCredentials = (staff: StaffMember) => {
    const text = `🎉 Splinzo Support Staff Access:\nName: ${staff.name}\nDepartment: ${staff.departmentLabel}\nStaff ID / Username: ${staff.username}\nPassword: ${staff.password}\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = staffList.filter((s) => s.isActive).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Staff Management & Access Control
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create staff IDs, assign department queues, and manage operational credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-3 rounded-2xl font-black text-xs transition-transform hover:scale-[1.02] flex items-center gap-2 shrink-0 shadow-sm"
          style={{ background: AMBER, color: "#111827" }}
        >
          <UserPlus size={16} />
          Create New Staff ID & Pass
        </button>
      </div>

      {/* ── METRIC STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Staff</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{staffList.length}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Active Agents</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Assigned Load</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {staffList.reduce((acc, s) => acc + (s.assignedCount || 0), 0)}
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Authentication</span>
          <div className="text-xs font-mono font-bold text-gray-700 mt-2">Secret /login only</div>
        </div>
      </div>

      {/* ── STAFF ROSTER TABLE ── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900">Active Staff Roster</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-700 font-bold">
              {staffList.length} accounts
            </span>
          </div>
          <span className="text-[11px] text-gray-500">Staff log in via standard user login screen</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
              <Users size={24} />
            </div>
            <p className="text-xs text-gray-500 font-medium">No staff accounts created yet.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              + Create the first staff member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-3 pl-2">Staff Member</th>
                  <th className="pb-3">Staff ID / Username</th>
                  <th className="pb-3">Department Queue</th>
                  <th className="pb-3">Assigned Load</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffList.map((staff) => {
                  const isRevealed = revealedPasswords[staff.id];
                  const isEditingPass = editingStaffId === staff.id;

                  return (
                    <tr key={staff.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="font-bold text-gray-900 text-sm">{staff.name}</div>
                        <div className="text-[11px] text-gray-500">{staff.email}</div>
                      </td>

                      <td className="py-3.5">
                        <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          {staff.username}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {staff.departmentLabel || staff.department}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono text-gray-700 font-semibold">
                        {staff.assignedCount || 0} active tickets
                      </td>

                      <td className="py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                            staff.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {staff.isActive ? "● Active" : "○ Suspended"}
                        </button>
                      </td>

                      <td className="py-3.5 pr-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Copy Credentials */}
                          <button
                            type="button"
                            onClick={() => handleCopyStaffCredentials(staff)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            title="Copy credentials card"
                          >
                            {copiedId === staff.id ? (
                              <CheckCircle2 size={15} className="text-emerald-600" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>

                          {/* Reveal / Reset Password */}
                          {isEditingPass ? (
                            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-300 shadow-xs">
                              <input
                                type="text"
                                placeholder="New pass"
                                value={newPasswordInput}
                                onChange={(e) => setNewPasswordInput(e.target.value)}
                                className="px-2 py-0.5 w-24 bg-transparent text-gray-900 text-[11px] font-mono outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePassword(staff.id)}
                                className="px-2 py-0.5 rounded bg-amber-400 text-gray-950 font-bold text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStaffId(null)}
                                className="px-1 py-0.5 text-gray-500 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaffId(staff.id);
                                setNewPasswordInput(staff.password);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-mono text-gray-700 transition-colors flex items-center gap-1"
                              title="Reset Password"
                            >
                              <Key size={13} />
                              {isRevealed ? staff.password : "••••••"}
                            </button>
                          )}

                          {/* Delete Staff */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete staff member"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SUPER ADMIN MASTER CREDENTIALS CARD ── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Super Admin Master Credentials</h3>
            <p className="text-xs text-gray-500">Master bypass keys reserved exclusively for the system owner.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center text-xs font-mono">
            <span className="text-gray-500">Admin Username:</span>
            <span className="text-amber-700 font-bold">{ADMIN_USERNAME}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center text-xs font-mono">
            <span className="text-gray-500">Admin Passkey:</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-bold">
                {showAdminKey ? DEFAULT_ADMIN_SECRET_KEY : "••••••••••••"}
              </span>
              <button
                type="button"
                onClick={() => setShowAdminKey(!showAdminKey)}
                className="text-[10px] text-gray-500 hover:text-gray-900 font-bold"
              >
                {showAdminKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Staff Modal */}
      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
