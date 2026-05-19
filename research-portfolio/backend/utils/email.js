/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/utils/email.js
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────
// TRANSPORTER
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
});

// Verify on startup (non-blocking)
transporter.verify((err) => {
  if (err) {
    console.warn("[Email] ⚠️  SMTP not ready:", err.message);
    console.warn("[Email] Set EMAIL_HOST/USER/PASS in .env to enable emails.");
  } else {
    console.log("[Email] ✅ SMTP transporter ready.");
  }
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#10b981);padding:24px 32px;">
            <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">
              Research Portfolio
            </h1>
          </td>
        </tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #334155;">
            <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
              This email was sent by Research Portfolio. If you didn't request this, ignore it safely.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(href, label) {
  return `<a href="${href}"
    style="display:inline-block;margin-top:24px;padding:13px 30px;
    background:linear-gradient(135deg,#3b82f6,#10b981);
    color:#fff;text-decoration:none;border-radius:10px;
    font-weight:600;font-size:14px;letter-spacing:0.2px;">
    ${label}
  </a>`;
}

// ─────────────────────────────────────────────
// CORE sendEmail
// ─────────────────────────────────────────────
/**
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 * @param {string} [options.from]
 */
export async function sendEmail({ to, subject, html, text, from }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      `[Email] ⚠️  Skipping email to ${to} — EMAIL_USER/PASS not set.`,
    );
    return { skipped: true };
  }

  const mailOptions = {
    from:
      from ||
      process.env.EMAIL_FROM ||
      `Research Portfolio <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || stripHtml(html),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Sent → ${to} | ${subject}`);
    return info;
  } catch (err) {
    console.error(`[Email] ❌ Failed → ${to}:`, err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
// TEMPLATE 1: Email Verification
// ─────────────────────────────────────────────
export async function sendVerificationEmail(to, name, verifyUrl) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">Welcome, ${name}! 👋</h2>
    <p style="color:#94a3b8;margin:0 0 6px;line-height:1.6;">
      Thanks for signing up. Please verify your email to activate your account.
    </p>
    <p style="color:#64748b;font-size:13px;margin:0;">
      This link expires in <strong style="color:#f59e0b;">24 hours</strong>.
    </p>
    ${ctaButton(verifyUrl, "Verify Email Address")}
    <p style="color:#475569;font-size:12px;margin-top:20px;">
      Or paste: <span style="color:#3b82f6;word-break:break-all;">${verifyUrl}</span>
    </p>
  `);
  return sendEmail({
    to,
    subject: "Verify your email — Research Portfolio",
    html,
  });
}

// ─────────────────────────────────────────────
// TEMPLATE 2: Password Reset
// ─────────────────────────────────────────────
export async function sendPasswordResetEmail(to, name, resetUrl) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">Password Reset</h2>
    <p style="color:#94a3b8;margin:0 0 6px;line-height:1.6;">
      Hi <strong style="color:#f1f5f9;">${name}</strong>, we received a password reset request.
    </p>
    <p style="color:#64748b;font-size:13px;margin:0;">
      Expires in <strong style="color:#f59e0b;">1 hour</strong>.
    </p>
    ${ctaButton(resetUrl, "Reset My Password")}
    <p style="color:#475569;font-size:12px;margin-top:20px;">
      Or paste: <span style="color:#3b82f6;word-break:break-all;">${resetUrl}</span>
    </p>
  `);
  return sendEmail({
    to,
    subject: "Reset your password — Research Portfolio",
    html,
  });
}

// ─────────────────────────────────────────────
// TEMPLATE 3: Welcome (post-verification)
// ─────────────────────────────────────────────
export async function sendWelcomeEmail(to, name) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">You're all set, ${name}! 🎉</h2>
    <p style="color:#94a3b8;margin:0;line-height:1.6;">
      Your email has been verified. Log in and explore your research portfolio.
    </p>
    ${ctaButton(process.env.CLIENT_URL || "http://localhost:5173", "Go to Dashboard")}
  `);
  return sendEmail({ to, subject: "Welcome to Research Portfolio 🎉", html });
}

// ─────────────────────────────────────────────
// TEMPLATE 4: Contact Notification (to admin)
// Called by feedbackController.submitFeedback
// ─────────────────────────────────────────────
/**
 * @param {object} options
 * @param {string} options.adminEmail
 * @param {string} options.senderName
 * @param {string} options.senderEmail
 * @param {string} options.subject
 * @param {string} options.message
 */
export async function sendContactNotificationEmail({
  adminEmail,
  senderName,
  senderEmail,
  subject,
  message,
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;">📬 New Contact Message</h2>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;width:90px;vertical-align:top;">
          From:
        </td>
        <td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:600;">
          ${senderName}
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;vertical-align:top;">
          Email:
        </td>
        <td style="padding:8px 0;">
          <a href="mailto:${senderEmail}"
            style="color:#3b82f6;font-size:14px;text-decoration:none;">
            ${senderEmail}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;vertical-align:top;">
          Subject:
        </td>
        <td style="padding:8px 0;color:#f1f5f9;font-size:14px;">
          ${subject || "(No subject)"}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:16px;">
          <div style="background:#0f172a;border-radius:10px;padding:16px;
            border-left:3px solid #3b82f6;">
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;
              white-space:pre-wrap;">${message}</p>
          </div>
        </td>
      </tr>
    </table>
    ${ctaButton(
      `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/feedback`,
      "View in Admin Dashboard",
    )}
  `);

  return sendEmail({
    to: adminEmail || process.env.EMAIL_USER,
    subject: `📬 New message from ${senderName} — Research Portfolio`,
    html,
  });
}

// ─────────────────────────────────────────────
// TEMPLATE 5: Contact Confirmation (to sender)
// Called by feedbackController.submitFeedback
// ─────────────────────────────────────────────
/**
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.name
 * @param {string} options.subject
 */
export async function sendContactConfirmationEmail({ to, name, subject }) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">
      Thanks for reaching out, ${name}! ✉️
    </h2>
    <p style="color:#94a3b8;margin:0 0 8px;line-height:1.6;">
      We've received your message about
      <strong style="color:#f1f5f9;">"${subject}"</strong>
      and will get back to you as soon as possible.
    </p>
    <p style="color:#64748b;font-size:13px;margin:0;">
      Typical response time: <strong style="color:#10b981;">1–2 business days</strong>.
    </p>
    <div style="margin-top:24px;padding:16px;background:#0f172a;border-radius:10px;
      border-left:3px solid #10b981;">
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
        While you wait, feel free to explore our research publications and projects.
      </p>
    </div>
    ${ctaButton(process.env.CLIENT_URL || "http://localhost:5173", "Visit Research Portfolio")}
  `);

  return sendEmail({
    to,
    subject: "We received your message — Research Portfolio",
    html,
  });
}

export default sendEmail;
