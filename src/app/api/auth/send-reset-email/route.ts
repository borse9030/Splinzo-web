import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { generatePasswordResetEmailHtml } from "@/lib/email/templates/password-reset";
import { Resend } from "resend";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400, headers: corsHeaders }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[send-reset-email] Missing RESEND_API_KEY");
      return NextResponse.json(
        { error: "Email service is temporarily unconfigured. Please contact support." },
        { status: 500, headers: corsHeaders }
      );
    }

    const { auth } = getFirebaseAdmin();

    // 1. Generate the Firebase Auth password reset link
    let firebaseLink: string;
    try {
      firebaseLink = await auth.generatePasswordResetLink(email, {
        url: "https://www.splinzo.in/reset-password",
      });
    } catch (err: any) {
      console.error("[send-reset-email] Firebase Admin error:", err);
      if (err?.code === "auth/user-not-found") {
        return NextResponse.json(
          { error: "No Splinzo account found with this email address." },
          { status: 404, headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { error: err?.message || "Failed to generate password reset request." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Extract oobCode and construct the direct custom Splinzo reset URL
    let resetUrl = firebaseLink;
    try {
      const parsed = new URL(firebaseLink);
      const oobCode = parsed.searchParams.get("oobCode");
      if (oobCode) {
        resetUrl = `https://www.splinzo.in/reset-password?oobCode=${oobCode}`;
      }
    } catch (e) {
      console.warn("[send-reset-email] Failed to parse firebaseLink, using raw link:", e);
    }

    // 3. Generate the rich HTML email with the Splinzo Logo
    const emailHtml = generatePasswordResetEmailHtml({
      resetUrl,
      userEmail: email,
    });

    const resend = new Resend(resendApiKey);

    // 4. Send the email with fallback logic
    let sendResult = await resend.emails.send({
      from: "Splinzo <noreply@splinzo.in>",
      to: email,
      subject: "Reset your password for Splinzo",
      html: emailHtml,
    });

    if (sendResult.error) {
      console.warn(
        "[send-reset-email] Custom domain send failed, falling back to onboarding domain:",
        sendResult.error
      );
      sendResult = await resend.emails.send({
        from: "Splinzo <onboarding@resend.dev>",
        to: email,
        subject: "Reset your password for Splinzo",
        html: emailHtml,
      });
    }

    if (sendResult.error) {
      console.error("[send-reset-email] Resend delivery error:", sendResult.error);
      return NextResponse.json(
        { error: "Failed to deliver reset email. Please try again in a few moments." },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset link sent successfully.",
        deliveryId: sendResult.data?.id,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[send-reset-email] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected server error occurred. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
