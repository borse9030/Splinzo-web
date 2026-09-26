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
  const rawKey =
    getRuntimeEnv("FIREBASE_SERVICE_ACCOUNT_KEY") ||
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
      if (!raw.startsWith("{")) {
        try {
          raw = Buffer.from(raw, "base64").toString("utf-8").trim();
        } catch (_) {}
      }
      const parsed = JSON.parse(raw);
      parsedSuccess = true;
      clientEmail = parsed.client_email || "";
      projectId = parsed.project_id || "";
    } catch (e: any) {
      parseError = e?.message || "Invalid JSON";
    }
  }

  const { isConfigured } = getFirebaseAdmin();
  let realEnvKeys: string[] = [];
  try {
    const realEnv = eval("process.env") as Record<string, string | undefined>;
    realEnvKeys = Object.keys(realEnv).filter(
      (k) =>
        k.toLowerCase().includes("firebase") ||
        k.toLowerCase().includes("service") ||
        k.toLowerCase().includes("admin") ||
        k.toLowerCase().includes("resend")
    );
  } catch (_) {}

  return NextResponse.json(
    {
      isConfigured,
      hasEnvVar: rawKey.length > 0,
      envKeyLength: rawKey.length,
      realEnvKeys,
      parsedSuccess,
      clientEmail,
      projectId,
      parseError: parseError || undefined,
      serverTime: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
