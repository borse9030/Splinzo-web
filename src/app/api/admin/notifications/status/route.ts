import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, hasFirebaseAdminCredentials } from "@/lib/firebaseAdmin";

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
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_ADMIN_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "";

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
  const existingEnvKeys = Object.keys(process.env).filter(
    (k) =>
      k.toLowerCase().includes("firebase") ||
      k.toLowerCase().includes("service") ||
      k.toLowerCase().includes("admin")
  );

  return NextResponse.json(
    {
      isConfigured,
      hasEnvVar: rawKey.length > 0,
      envKeyLength: rawKey.length,
      existingEnvKeys,
      parsedSuccess,
      clientEmail,
      projectId,
      parseError: parseError || undefined,
      serverTime: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
