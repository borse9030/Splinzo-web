import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getRuntimeEnv } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const directKey = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "").trim();
  const directPublicKey = (process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY || "").trim();
  const rawKey =
    directKey ||
    directPublicKey ||
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT_KEY") ||
    getRuntimeEnv("NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY") ||
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT") ||
    getRuntimeEnv("FIREBASE_ADMIN_KEY") ||
    getRuntimeEnv("GOOGLE_APPLICATION_CREDENTIALS");

  let parsedSuccess = false;
  let clientEmail = "";
  let projectId = "";
  let parseError = "";

  if (rawKey.trim()) {
    try {
      let raw = rawKey.trim();
      // Remove wrapping single or double quotes
      if (
        (raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"'))
      ) {
        raw = raw.slice(1, -1).trim();
      }
      if (!raw.startsWith("{")) {
        try {
          const decoded = Buffer.from(raw, "base64").toString("utf-8").trim();
          if (decoded.startsWith("{")) {
            raw = decoded;
          }
        } catch (_) {}
      }
      if (
        (raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"'))
      ) {
        raw = raw.slice(1, -1).trim();
      }
      const parsed = JSON.parse(raw);
      parsedSuccess = true;
      clientEmail = parsed.client_email || "";
      projectId = parsed.project_id || "";
    } catch (e: any) {
      parseError = e?.message || "Invalid JSON";
    }
  }

  // Also check separate client email and private key
  const directPrivKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || "").trim();
  const directEmail = (process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || "").trim();

  const { isConfigured } = getFirebaseAdmin();

  let realEnvKeys: string[] = [];
  try {
    const realEnv = (globalThis as any).process?.env || process.env;
    if (realEnv) {
      realEnvKeys = Object.keys(realEnv).filter(
        (k) =>
          k.toLowerCase().includes("firebase") ||
          k.toLowerCase().includes("service") ||
          k.toLowerCase().includes("admin") ||
          k.toLowerCase().includes("resend") ||
          k.toLowerCase().includes("secret")
      );
    }
  } catch (_) {}

  return NextResponse.json(
    {
      isConfigured,
      hasEnvVar: rawKey.length > 0 || (directPrivKey.length > 0 && directEmail.length > 0),
      envKeyLength: rawKey.length,
      directKeyLength: directKey.length,
      directKeyPrefix: directKey.length > 0 ? directKey.substring(0, 15) : undefined,
      directPublicKeyLength: directPublicKey.length,
      hasSeparateCreds: directPrivKey.length > 0 && directEmail.length > 0,
      realEnvKeys,
      parsedSuccess,
      clientEmail: clientEmail || directEmail || "",
      projectId,
      parseError: parseError || undefined,
      serverTime: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
