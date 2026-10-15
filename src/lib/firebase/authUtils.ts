import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider } from "./config";
import { userService } from "@/services/userService";

/**
 * Checks whether the current browser is Apple Safari (macOS or iOS)
 * or any browser running on iOS (WebKit engine with strict storage partitioning and popup blocking).
 */
export function isSafariOrIOS(): boolean {
  if (typeof window === "undefined" || !navigator) return false;
  const ua = navigator.userAgent || "";
  
  // iOS devices (iPhone, iPad, iPod)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Safari on macOS or iOS (excludes Chrome/Firefox/Edge on macOS)
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chrome|CriOS|Android|FxiOS|EdgiOS/i.test(ua);

  return isIOS || isSafari;
}

/**
 * Executes Google Authentication with built-in resilience for Safari and iOS.
 * - On iOS or Safari with strict popup blocking, gracefully utilizes redirect flow.
 * - On standard desktop browsers, utilizes fast popup sign-in.
 * - If popup fails for any reason (blocked popup, closed window, cross-origin ITP block),
 *   seamlessly falls back to redirect flow so users are never blocked.
 */
export async function executeGoogleAuth(): Promise<{
  credential: UserCredential | null;
  redirecting: boolean;
}> {
  // If user is on an iOS device (iPhone/iPad), popup windows open in separate tabs
  // and lose window.opener communication with parent window. Directly use redirect.
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileIOS = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isMobileIOS) {
    console.log("[Auth] iOS detected, initiating seamless Google redirect flow...");
    await signInWithRedirect(auth, googleProvider);
    return { credential: null, redirecting: true };
  }

  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return { credential: cred, redirecting: false };
  } catch (err: any) {
    console.warn("[Auth] signInWithPopup encountered issue:", err?.code, err?.message);

    // Safari popup blocked, closed before handshake, or cross-origin ITP error:
    const isPopupIssue =
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/popup-closed-by-user" ||
      err?.code === "auth/cancelled-popup-request" ||
      err?.code === "auth/internal-error" ||
      isSafariOrIOS();

    if (isPopupIssue) {
      console.log("[Auth] Safari or popup blocker active. Falling back to signInWithRedirect...");
      await signInWithRedirect(auth, googleProvider);
      return { credential: null, redirecting: true };
    }

    throw err;
  }
}

/**
 * Checks and processes any incoming redirect result after returning from Google OAuth redirect.
 * If a user signed in via redirect, automatically creates/syncs their Firestore account and returns the user.
 */
export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;

    const user = result.user;
    await userService.createUser(
      user.uid,
      user.email || "",
      user.displayName || "User",
      user.photoURL || ""
    );

    return result;
  } catch (err: any) {
    // If no redirect happened or already handled, safely ignore
    if (err?.code !== "auth/credential-already-in-use") {
      console.warn("[Auth] getRedirectResult notice:", err);
    }
    return null;
  }
}
