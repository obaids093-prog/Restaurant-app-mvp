// services/emailService.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Sends transactional emails using Nodemailer with optional
//   SMTP credentials from environment variables. When SMTP is
//   not configured, emails are logged to stdout (console mode)
//   so the app remains functional during local development.
//
//   Required env vars for live email:
//     SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//   Optional:
//     SMTP_FROM  (defaults to SMTP_USER)
// ═══════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send a transactional email.
 * Falls back to console logging when SMTP credentials are absent.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 * @returns {Promise<{ accepted: string[], messageId?: string }>}
 */
const sendMail = async ({ to, subject, text, html }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@aura.pk';

  if (transporter && smtpConfigured) {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { accepted: info.accepted || [to], messageId: info.messageId };
  }

  // Console-only fallback for local development and test environments
  console.log('─────────────────────────────────────────');
  console.log(`[Email Service - Console Mode]`);
  console.log(`  To:      ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body:    ${text}`);
  console.log('─────────────────────────────────────────');

  return { accepted: [to], messageId: `console-${Date.now()}` };
};

/**
 * Send a password reset email with a tokenized link.
 *
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Raw (unhashed) token for the URL
 * @param {string} [baseUrl] - Front-end base URL (defaults to env or localhost)
 */
const sendPasswordResetEmail = async (email, resetToken, baseUrl) => {
  const origin = baseUrl || process.env.FRONTEND_URL || 'http://localhost:8081';
  const resetLink = `${origin}/reset-password?token=${resetToken}`;

  const subject = 'AURA — Password Reset Request';
  const text = [
    'You requested a password reset for your AURA dining account.',
    '',
    `Use this link to set a new password (valid for 30 minutes):`,
    resetLink,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    '— AURA Hospitality Team',
  ].join('\n');

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #D4AF37;">AURA — Password Reset</h2>
      <p>You requested a password reset for your AURA dining account.</p>
      <p>Click the button below to set a new password (valid for 30 minutes):</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}"
           style="background: #D4AF37; color: #121212; padding: 12px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  _smtpConfigured: smtpConfigured,
};

