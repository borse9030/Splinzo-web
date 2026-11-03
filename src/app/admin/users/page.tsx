"use client";

import { useState, useEffect, useCallback } from "react";
import { AppUser } from "@/types/user";
import {
  Users,
  Search,
  Shield,
  CreditCard,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const staffKey = typeof window !== "undefined" ? sessionStorage.getItem("splinzo_staff_session_key") || "" : "";
      const res = await fetch("/api/admin/users?limit=250", {
        headers: {
          "x-admin-key": staffKey,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load users from admin API");
      }

      setUsers(data.users || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err?.message || "Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: "user" | "support_staff" | "admin") => {
    setUpdatingUid(userId);
    try {
      const staffKey = typeof window !== "undefined" ? sessionStorage.getItem("splinzo_staff_session_key") || "" : "";
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": staffKey,
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      console.error("Failed to update role:", err);
      alert(err?.message || "Failed to update role.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.displayName || u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || u.phoneNumber || "").toLowerCase().includes(q) ||
      (u.upiId || "").toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "Recent";
    try {
      if (typeof createdAt?.toDate === "function") {
        return createdAt.toDate().toLocaleDateString();
      }
      return new Date(createdAt).toLocaleDateString();
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">User Directory & Investigation</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Inspect live user profiles, registered UPI IDs, and manage staff privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
            {users.length} {users.length === 1 ? "User" : "Users"}
          </div>
          <button
            onClick={() => loadUsers()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── ERROR ALERT IF ANY ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error loading directory:</span> {error}
          </div>
          <button
            onClick={() => loadUsers()}
            className="underline font-bold text-rose-700 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── SEARCH BAR ── */}
      <div className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, phone number, registered UPI ID, or UID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-xs outline-none focus:border-amber-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* ── USERS TABLE ── */}
      <div className="rounded-3xl bg-white border border-gray-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            <div className="h-8 w-8 mx-auto rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-2" />
            Loading user profiles…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No users match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-mono uppercase text-[10px] bg-gray-50/60 font-bold">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Registered UPI ID</th>
                  <th className="py-3 px-4 font-semibold">Currency</th>
                  <th className="py-3 px-4 font-semibold">Role & Permissions</th>
                  <th className="py-3 px-4 font-semibold text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-amber-50/20 transition-colors">
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-700 text-xs shrink-0 overflow-hidden">
                          {u.photoUrl || u.photoURL ? (
                            <img src={u.photoUrl || u.photoURL} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (u.displayName || u.name || "U")[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{u.displayName || u.name || "Unnamed"}</div>
                          <div className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-gray-700">
                      <div>{u.email}</div>
                      {u.phone || u.phoneNumber ? (
                        <div className="text-[11px] text-gray-500 font-mono">{u.phone || u.phoneNumber}</div>
                      ) : null}
                    </td>

                    {/* UPI ID */}
                    <td className="py-3 px-4">
                      {u.upiId ? (
                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          {u.upiId}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-mono">Not set</span>
                      )}
                    </td>

                    {/* Currency */}
                    <td className="py-3 px-4 text-gray-500 font-mono">
                      {u.defaultCurrency || "INR"}
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        disabled={updatingUid === u.id}
                        value={u.role || "user"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold outline-none border transition-colors cursor-pointer ${
                          u.role === "admin"
                            ? "bg-[#F9B912] text-gray-950 border-amber-400"
                            : u.role === "support_staff"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="support_staff">Support Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-right text-gray-500 font-mono whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
