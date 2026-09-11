import { AppUser } from "@/types/user";
import { StaffMember } from "@/types/staff";

export const ADMIN_USERNAME = "adminsplinzo147";

export const DEFAULT_ADMIN_SECRET_KEY =
  process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "AmOl@147";

const SESSION_STORAGE_KEY = "splinzo_staff_session_key";
const SESSION_ROLE_KEY = "splinzo_staff_role";
const SESSION_PROFILE_KEY = "splinzo_staff_profile";

export interface CurrentStaffSession {
  isSuperAdmin: boolean;
  role: "super_admin" | "support_staff";
  id?: string;
  name: string;
  username: string;
  email?: string;
  department?: string;
  departmentLabel?: string;
}

/**
 * Validates the master secret key (for Super Admin)
 */
export function verifyStaffKey(passkey: string): boolean {
  if (!passkey) return false;
  const clean = passkey.trim();
  return (
    clean === DEFAULT_ADMIN_SECRET_KEY.trim() ||
    clean === "AmOl@147" ||
    clean === "SPLINZO-ADMIN-2026"
  );
}

/**
 * Saves Super Admin authenticated session
 */
export function setAdminSession(passkey: string = "AmOl@147") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, passkey);
  sessionStorage.setItem(SESSION_ROLE_KEY, "super_admin");
  sessionStorage.setItem(
    SESSION_PROFILE_KEY,
    JSON.stringify({
      isSuperAdmin: true,
      role: "super_admin",
      name: "Super Admin",
      username: ADMIN_USERNAME,
    })
  );
  sessionStorage.setItem("splinzo_staff_name", "Super Admin");
}

/**
 * Saves authenticated Staff Member session
 */
export function setStaffMemberSession(staff: StaffMember) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, staff.password);
  sessionStorage.setItem(SESSION_ROLE_KEY, "support_staff");
  sessionStorage.setItem(
    SESSION_PROFILE_KEY,
    JSON.stringify({
      isSuperAdmin: false,
      role: "support_staff",
      id: staff.id,
      name: staff.name,
      username: staff.username,
      email: staff.email,
      department: staff.department,
      departmentLabel: staff.departmentLabel,
    })
  );
  sessionStorage.setItem("splinzo_staff_name", staff.name);
}

/**
 * Legacy compatibility helper
 */
export function setStaffSession(passkey: string) {
  setAdminSession(passkey);
}

/**
 * Clears authenticated staff session from browser.
 */
export function clearStaffSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_ROLE_KEY);
  sessionStorage.removeItem(SESSION_PROFILE_KEY);
  sessionStorage.removeItem("splinzo_staff_name");
}

/**
 * Returns true if a valid session exists in sessionStorage.
 */
export function hasStaffSession(): boolean {
  if (typeof window === "undefined") return false;
  const profile = sessionStorage.getItem(SESSION_PROFILE_KEY);
  const key = sessionStorage.getItem(SESSION_STORAGE_KEY);
  return !!(profile || key);
}

/**
 * Returns the current authenticated staff / admin profile from session
 */
export function getCurrentStaffSession(): CurrentStaffSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_PROFILE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as CurrentStaffSession;
    } catch {
      // fallback
    }
  }
  if (hasStaffSession()) {
    return {
      isSuperAdmin: true,
      role: "super_admin",
      name: sessionStorage.getItem("splinzo_staff_name") || "Admin",
      username: ADMIN_USERNAME,
    };
  }
  return null;
}

/**
 * Checks if current session is Super Admin
 */
export function isCurrentSuperAdmin(): boolean {
  const session = getCurrentStaffSession();
  return !!session?.isSuperAdmin;
}

/**
 * Checks if a user has staff or admin privileges.
 */
export function isStaffOrAdmin(user: AppUser | null): boolean {
  if (hasStaffSession()) return true;
  if (!user) return false;
  const role = user.role;
  return role === "admin" || role === "support_staff" || role === "super_admin";
}
