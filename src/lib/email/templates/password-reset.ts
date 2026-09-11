export function generatePasswordResetEmailHtml({
  resetUrl,
  userEmail,
}: {
  resetUrl: string;
  userEmail: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Splinzo password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0b08;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #FFFFFF;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #0c0b08;
      padding: 40px 16px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #151410;
      border: 1px solid rgba(249, 185, 18, 0.22);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(249, 185, 18, 0.05);
    }
    .header {
      padding: 36px 32px 24px;
      text-align: center;
      background: linear-gradient(180deg, rgba(249, 185, 18, 0.08) 0%, rgba(21, 20, 16, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .logo-container {
      display: inline-block;
      margin-bottom: 16px;
    }
    .logo-img {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      object-fit: contain;
      box-shadow: 0 8px 24px rgba(249, 185, 18, 0.25);
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      margin: 0;
    }
    .brand-accent {
      color: #F9B912;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 12px;
      letter-spacing: -0.3px;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #A3A3A3;
      margin: 0 0 24px;
    }
    .user-pill {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(249, 185, 18, 0.1);
      border: 1px solid rgba(249, 185, 18, 0.25);
      border-radius: 6px;
      color: #F9B912;
      font-family: monospace;
      font-size: 13px;
      word-break: break-all;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .reset-btn {
      display: inline-block;
      padding: 15px 36px;
      background: linear-gradient(135deg, #F9B912 0%, #E09E00 100%);
      color: #0A0A0A !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(249, 185, 18, 0.35);
      letter-spacing: 0.2px;
    }
    .fallback-box {
      margin-top: 24px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
    }
    .fallback-label {
      font-size: 12px;
      color: #737373;
      margin: 0 0 6px;
    }
    .fallback-url {
      font-size: 12px;
      color: #F9B912;
      word-break: break-all;
      text-decoration: none;
      line-height: 1.4;
    }
    .security-note {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 12px;
      line-height: 1.5;
      color: #737373;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      background: #100F0C;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 12px;
      color: #525252;
    }
    .footer a {
      color: #A3A3A3;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-container">
          <img src="https://www.splinzo.in/logo.png" alt="Splinzo Logo" class="logo-img" width="56" height="56">
        </div>
        <h1 class="brand-name">Splinzo<span class="brand-accent">.</span></h1>
      </div>

      <div class="content">
        <h2 class="title">Reset Your Password</h2>
        <p class="paragraph">
          We received a password reset request for your account associated with <span class="user-pill">${userEmail}</span>.
        </p>
        <p class="paragraph">
          Click the button below to choose a new, secure password. This link will be active for <strong>1 hour</strong>.
        </p>

        <div class="button-container">
          <a href="${resetUrl}" target="_blank" class="reset-btn">
            Reset Password &rarr;
          </a>
        </div>

        <div class="fallback-box">
          <p class="fallback-label">Button not working? Copy and paste this link into your browser:</p>
          <a href="${resetUrl}" target="_blank" class="fallback-url">${resetUrl}</a>
        </div>

        <div class="security-note">
          <strong>Security Note:</strong> If you did not request this password reset, please disregard this email. Your Splinzo account remains completely secure and no changes have been made.
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px;">&copy; 2026 Splinzo &bull; Smart Expense Sharing</p>
        <p style="margin: 0;"><a href="https://www.splinzo.in">www.splinzo.in</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
