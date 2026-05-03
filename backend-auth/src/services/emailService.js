const nodemailer = require("nodemailer");

/**
 * Email Service
 * Sends themed HTML emails for verification and password reset.
 */

// ── Transporter (lazy-init) ──────────────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
}

// ── Shared email wrapper ─────────────────────────────────────────────────────

function buildHtmlEmail({ heading, bodyHtml, buttonText, buttonUrl }) {
  const fromName = process.env.SMTP_FROM_NAME || "UP Knowledge Graph";
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${fromName}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 20px;">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:700;">${heading}</h2>
            <div style="color:#475569;font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </div>
          </td>
        </tr>
        <!-- Button -->
        <tr>
          <td style="padding:8px 40px 36px;text-align:center;">
            <a href="${buttonUrl}" target="_blank"
               style="display:inline-block;padding:14px 36px;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
              ${buttonText}
            </a>
            <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
              If the button doesn't work, copy and paste this URL into your browser:<br/>
              <a href="${buttonUrl}" style="color:#3b82f6;word-break:break-all;">${buttonUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send email verification link
 * @param {Object} user  – mongoose user doc (needs firstName, email)
 * @param {String} token – plain-text token
 */
async function sendVerificationEmail(user, token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${frontendUrl}/verify-email/${token}`;

  const html = buildHtmlEmail({
    heading: "Verify Your Email Address",
    bodyHtml: `
      <p>Hi <strong>${user.firstName}</strong>,</p>
      <p>Thank you for joining UP Knowledge Graph! Please verify your email address to unlock full access to the platform.</p>
      <p style="color:#94a3b8;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
    `,
    buttonText: "Verify Email Address",
    buttonUrl: verifyUrl,
  });

  await getTransporter().sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "UP Knowledge Graph"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Verify Your Email — UP Knowledge Graph",
    html,
  });
}

/**
 * Send password-reset link
 * @param {Object} user  – mongoose user doc
 * @param {String} token – plain-text token
 */
async function sendPasswordResetEmail(user, token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password/${token}`;

  const html = buildHtmlEmail({
    heading: "Reset Your Password",
    bodyHtml: `
      <p>Hi <strong>${user.firstName}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="color:#94a3b8;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
    `,
    buttonText: "Reset Password",
    buttonUrl: resetUrl,
  });

  await getTransporter().sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "UP Knowledge Graph"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Reset Your Password — UP Knowledge Graph",
    html,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
