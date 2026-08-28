"use client";
import { useEffect } from "react";

export function ErrorHandler() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Catch the annoying Firebase IndexedDB HMR error and stop it from showing a red overlay
      if (event.reason && event.reason.message && event.reason.message.includes("Database is closing/hidden")) {
        event.preventDefault(); // Prevents the Next.js error overlay
        console.warn("Suppressed Firebase HMR error:", event.reason.message);
      }
    };
    
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("Database is closing/hidden")) {
        event.preventDefault();
        console.warn("Suppressed Firebase HMR error:", event.message);
      }
    };
    
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
