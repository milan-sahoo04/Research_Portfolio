const nodemailer = require("nodemailer");

// ─── Transporter ──────────────────────────────────────────────────────────────
// Single shared transporter — created once, reused for all sends.
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === "465", // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true, // reuse connections
    maxConnections: 5,
    maxMessages: 100,
  });

  return transporter;
};

// ─── Base sender ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${process.env.FROM_NAME || "Research Portfolio"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // strip HTML for plain text fallback
      attachments,
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`✉️  Email sent to ${to} — MessageId: ${info.messageId}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email send failed to ${to}:`, err.message);
    // Don't throw — let the caller decide whether to surface this to the user
    return { success: false, error: err.message };
  }
};

// ─── Shared HTML shell ────────────────────────────────────────────────────────
const emailShell = ({ title, previewText, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${previewText}" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f3f4f6;">${previewText}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-block;line-height:36px;text-align:center;">
                  <span style="font-size:20px;">🎓</span>
                </div>
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">Research Portfolio</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">
                This email was sent by Research Portfolio. If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin:0;color:#d1d5db;font-size:11px;">
                © ${new Date().getFullYear()} Research Portfolio · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Button helper ────────────────────────────────────────────────────────────
const primaryButton = (text, href) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${href}"
       style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;
              text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;
              border-radius:8px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(29,78,216,0.35);">
      ${text}
    </a>
  </div>
`;

const warningBox = (text) => `
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;color:#92400e;font-size:13px;">⚠️ &nbsp;${text}</p>
  </div>
`;

const infoBox = (text) => `
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;color:#1e40af;font-size:13px;">ℹ️ &nbsp;${text}</p>
  </div>
`;

// ─── 1. Welcome / Email Verification ─────────────────────────────────────────
const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const html = emailShell({
    title: "Verify your email — Research Portfolio",
    previewText: "One click to activate your account.",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Welcome, ${name}! 👋</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
        Thanks for joining Research Portfolio. Please verify your email address to activate your account and get started.
      </p>
      ${primaryButton("Verify Email Address", verificationUrl)}
      ${warningBox("This link expires in <strong>24 hours</strong>. If it expires, request a new one from the login page.")}
      <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;">
        Or paste this URL into your browser:<br/>
        <span style="color:#6b7280;word-break:break-all;">${verificationUrl}</span>
      </p>
    `,
  });

  return sendEmail({
    to,
    subject: "Verify your email — Research Portfolio",
    html,
  });
};

// ─── 2. Password Reset ────────────────────────────────────────────────────────
const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
  expiresInMinutes = 60,
}) => {
  const html = emailShell({
    title: "Reset your password — Research Portfolio",
    previewText: "We received a password reset request for your account.",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Reset your password</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi <strong>${name}</strong>, we received a request to reset the password for your account.
        Click the button below to choose a new password.
      </p>
      ${primaryButton("Reset Password", resetUrl)}
      ${warningBox(`This link expires in <strong>${expiresInMinutes} minutes</strong>. If you didn't request a reset, ignore this email — your password won't change.`)}
      <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;">
        Or paste this URL into your browser:<br/>
        <span style="color:#6b7280;word-break:break-all;">${resetUrl}</span>
      </p>
    `,
  });

  return sendEmail({
    to,
    subject: "Reset your password — Research Portfolio",
    html,
  });
};

// ─── 3. Password Changed Confirmation ────────────────────────────────────────
const sendPasswordChangedEmail = async ({ to, name, changedAt }) => {
  const timeStr = new Date(changedAt).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const html = emailShell({
    title: "Your password was changed — Research Portfolio",
    previewText: "Your account password was recently updated.",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Password changed ✅</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi <strong>${name}</strong>, your Research Portfolio account password was successfully changed on:
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin:0 0 20px;text-align:center;">
        <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${timeStr}</p>
      </div>
      ${warningBox("If you didn't make this change, <strong>reset your password immediately</strong> and contact support.")}
      ${primaryButton("Go to My Account", `${process.env.CLIENT_URL}/login`)}
    `,
  });

  return sendEmail({
    to,
    subject: "Your password was changed — Research Portfolio",
    html,
  });
};

// ─── 4. Welcome After Verification ───────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name }) => {
  const html = emailShell({
    title: "Welcome to Research Portfolio",
    previewText: "Your account is ready. Let's get started!",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">You're all set, ${name}! 🎉</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
        Your email is verified and your Research Portfolio account is now active. 
        Explore publications, projects, achievements, and more.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        ${[
          ["📄", "Publications", "Browse and manage research publications."],
          ["🔬", "Projects", "Showcase your ongoing and completed projects."],
          ["🏆", "Achievements", "Add patents, awards, and certifications."],
          ["👥", "Team", "Connect with collaborators and team members."],
        ]
          .map(
            ([icon, title, desc]) => `
          <tr>
            <td style="padding:8px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;padding-right:12px;vertical-align:top;font-size:20px;">${icon}</td>
                  <td>
                    <p style="margin:0 0 2px;color:#111827;font-size:14px;font-weight:600;">${title}</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;">${desc}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `,
          )
          .join("")}
      </table>
      ${primaryButton("Visit My Portfolio", process.env.CLIENT_URL)}
    `,
  });

  return sendEmail({ to, subject: "Welcome to Research Portfolio 🎓", html });
};

// ─── 5. Contact Form — Admin Notification ────────────────────────────────────
const sendContactNotificationEmail = async ({
  adminEmail,
  senderName,
  senderEmail,
  subject,
  message,
}) => {
  const html = emailShell({
    title: "New contact form submission",
    previewText: `${senderName} sent you a message via the portfolio.`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">📬 New Contact Message</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px;">
        ${[
          ["From", senderName],
          [
            "Email",
            `<a href="mailto:${senderEmail}" style="color:#1d4ed8;">${senderEmail}</a>`,
          ],
          ["Subject", subject],
        ]
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;width:100px;color:#6b7280;font-size:13px;font-weight:600;">${label}</td>
            <td style="padding:12px 16px;background:#ffffff;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${value}</td>
          </tr>
        `,
          )
          .join("")}
        <tr>
          <td style="padding:12px 16px;background:#f9fafb;color:#6b7280;font-size:13px;font-weight:600;vertical-align:top;">Message</td>
          <td style="padding:12px 16px;background:#ffffff;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</td>
        </tr>
      </table>
      ${primaryButton("Reply to " + senderName, `mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}`)}
    `,
  });

  return sendEmail({
    to: adminEmail,
    subject: `📬 New message from ${senderName}: ${subject}`,
    html,
  });
};

// ─── 6. Contact Form — Sender Confirmation ────────────────────────────────────
const sendContactConfirmationEmail = async ({ to, name, subject }) => {
  const html = emailShell({
    title: "We received your message",
    previewText: "Your message has been received. We'll get back to you soon.",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Message received ✅</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi <strong>${name}</strong>, thank you for reaching out. We've received your message about:
      </p>
      <div style="background:#f9fafb;border-left:4px solid #1d4ed8;padding:14px 18px;border-radius:0 8px 8px 0;margin:0 0 20px;">
        <p style="margin:0;color:#374151;font-size:14px;font-style:italic;">"${subject}"</p>
      </div>
      ${infoBox("We typically respond within <strong>1–2 business days</strong>.")}
      ${primaryButton("Visit Portfolio", process.env.CLIENT_URL)}
    `,
  });

  return sendEmail({
    to,
    subject: "We received your message — Research Portfolio",
    html,
  });
};

// ─── 7. Account Deactivation Notice ──────────────────────────────────────────
const sendAccountDeactivatedEmail = async ({ to, name, reason = "" }) => {
  const html = emailShell({
    title: "Your account has been deactivated",
    previewText: "Important notice about your Research Portfolio account.",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Account deactivated</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi <strong>${name}</strong>, your Research Portfolio account has been deactivated.
        ${reason ? `<br/><br/>Reason: <em>${reason}</em>` : ""}
      </p>
      ${warningBox("If you believe this is a mistake, please contact support.")}
      ${primaryButton("Contact Support", `mailto:${process.env.SMTP_USER}`)}
    `,
  });

  return sendEmail({
    to,
    subject: "Your account has been deactivated — Research Portfolio",
    html,
  });
};

// ─── 8. New Login Alert (optional) ───────────────────────────────────────────
const sendLoginAlertEmail = async ({ to, name, ip, device, time }) => {
  const html = emailShell({
    title: "New login to your account",
    previewText: "A new login was detected on your Research Portfolio account.",
    bodyHtml: `
      <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">New login detected 🔐</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
        Hi <strong>${name}</strong>, we noticed a new login to your account.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 20px;">
        ${[
          ["Time", new Date(time).toLocaleString()],
          ["IP Address", ip || "Unknown"],
          ["Device", device || "Unknown"],
        ]
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;width:120px;color:#6b7280;font-size:13px;font-weight:600;">${label}</td>
            <td style="padding:10px 16px;background:#ffffff;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${value}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
      ${warningBox("If this wasn't you, reset your password immediately.")}
      ${primaryButton("Secure My Account", `${process.env.CLIENT_URL}/auth/forgot-password`)}
    `,
  });

  return sendEmail({
    to,
    subject: "New login to your Research Portfolio account",
    html,
  });
};

// ─── Verify SMTP connection (call on server startup) ─────────────────────────
const verifyEmailConnection = async () => {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("✅ SMTP connection verified — email service ready.");
    return true;
  } catch (err) {
    console.warn(`⚠️  SMTP connection failed: ${err.message}`);
    console.warn("   Emails will not be sent. Check SMTP_* env variables.");
    return false;
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendContactNotificationEmail,
  sendContactConfirmationEmail,
  sendAccountDeactivatedEmail,
  sendLoginAlertEmail,
  verifyEmailConnection,
};
