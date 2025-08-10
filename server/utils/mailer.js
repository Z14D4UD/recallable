// server/utils/mailer.js
const nodemailer = require('nodemailer');

// -----------------------------------------------------------------------------
// SMTP config (GMAIL_*  or  EMAIL_*  env vars)
// -----------------------------------------------------------------------------
const smtpUser   = process.env.GMAIL_USER  || process.env.EMAIL_USER;
const smtpPass   = process.env.GMAIL_PASS  || process.env.EMAIL_PASS;
const smtpHost   = process.env.EMAIL_HOST  || 'smtp.gmail.com';
const smtpPort   = process.env.EMAIL_PORT  ? Number(process.env.EMAIL_PORT) : 465;
const smtpSecure = (process.env.EMAIL_SECURE ?? 'true') !== 'false'; // default true

if (!smtpUser || !smtpPass) {
  /* eslint-disable no-console */
  console.warn(
    '⚠️  Mail disabled: missing SMTP credentials. ' +
    'Set GMAIL_USER / GMAIL_PASS or EMAIL_USER / EMAIL_PASS.'
  );
}

function getTransport () {
  if (!smtpUser || !smtpPass) {
    return { sendMail: () => Promise.resolve('mail skipped – creds missing') };
  }
  return nodemailer.createTransport({
    host:   smtpHost,
    port:   smtpPort,
    secure: smtpSecure,
    auth:   { user: smtpUser, pass: smtpPass }
  });
}

const transporter = getTransport();
const fromAddr    = process.env.EMAIL_FROM || `Hyre <${smtpUser}>`;

// -----------------------------------------------------------------------------
// Previously-existing helpers
// -----------------------------------------------------------------------------
exports.sendBookingApprovalEmail = async ({
  customerEmail, customerName, bookingId, startDate, endDate
}) => {
  const html = `
    <p>Hi ${customerName},</p>
    <p>Your booking <strong>${bookingId}</strong> has been <b>approved</b>.</p>
    <p>${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}</p>
    <p>Thanks for using Hyre!</p>
  `;
  return transporter.sendMail({
    from: fromAddr,
    to:   customerEmail,
    subject: 'Your booking is approved',
    html
  });
};

exports.sendBookingRejectionEmail = async ({
  customerEmail, customerName, bookingId
}) => {
  const html = `
    <p>Hi ${customerName},</p>
    <p>We’re sorry — your booking <strong>${bookingId}</strong> has been declined.</p>
    <p>Please contact support if you have questions.</p>
  `;
  return transporter.sendMail({
    from: fromAddr,
    to:   customerEmail,
    subject: 'Your booking was declined',
    html
  });
};

/* ────────────────────────────────────────────────────────────────────────────
 * NEW: immediate confirmation right after checkout succeeds
 * ────────────────────────────────────────────────────────────────────────── */
exports.sendBookingReceivedEmail = async ({
  customerEmail, customerName, bookingId, startDate, endDate
}) => {
  const html = `
    <p>Hi ${customerName},</p>
    <p>We’ve received your booking <strong>${bookingId}</strong>.</p>
    <p>${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}</p>
    <p>The host will review and confirm shortly. You can reply to this e-mail or
       the in-app chat if you have questions.</p>
    <p>Thank you for choosing Hyre!</p>
  `;
  return transporter.sendMail({
    from: fromAddr,
    to:   customerEmail,
    subject: 'Booking received – pending host approval',
    html
  });
};

/* ────────────────────────────────────────────────────────────────────────────
 * ★ NEW: “Leave a review” e-mail helper
 * ────────────────────────────────────────────────────────────────────────── */
exports.sendReviewRequestEmail = async ({ customerEmail, customerName, reviewUrl }) => {
  const html = `
    <p>Hi ${customerName},</p>
    <p>Your trip has ended — we'd love to hear how it went.</p>
    <p>
      <a href="${reviewUrl}"
         style="display:inline-block;padding:10px 18px;background:#38b6ff;color:#fff;
                text-decoration:none;border-radius:4px">
         Leave a review
      </a>
    </p>
    <p>Thank you for choosing Hyre!</p>
  `;
  return transporter.sendMail({
    from: fromAddr,
    to:   customerEmail,
    subject: 'How was your trip?  Share a quick review',
    html
  });
};

exports.sendRefundIssuedEmail = async ({ customerEmail, amount, bookingId }) => {
  const html = `
    <p>Hi there,</p>
    <p>Your booking <strong>${bookingId}</strong> has been cancelled.</p>
    <p>We've issued a refund of <strong>£${amount.toFixed(2)}</strong> back to your original payment method.</p>
    <p>Please allow 3–5 business days for it to appear in your account.</p>
    <p>Thank you for using Hyre.</p>
  `;
  return transporter.sendMail({
    from: fromAddr,
    to: customerEmail,
    subject: 'Refund issued – Hyre',
    html
  });
};
