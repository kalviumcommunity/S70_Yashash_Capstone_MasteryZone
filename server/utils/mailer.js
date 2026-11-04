const nodemailer = require('nodemailer');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

function getLanIpAddress() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {}
  return '192.168.1.13';
}

let transporter = null;
let transporterInitPromise = null;
let isEtherealAccount = false;

// ── 1. INITIALIZE TRANSPORTER (REAL SMTP OR ETHEREAL FALLBACK) ──
function getTransporter() {
  if (transporter) return Promise.resolve(transporter);
  if (transporterInitPromise) return transporterInitPromise;

  transporterInitPromise = (async () => {
    const smtpEmail = (process.env.SMTP_EMAIL || process.env.EMAIL_USER || "").trim();
    const smtpPassword = (process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || "").trim().replace(/\s+/g, "");
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

    const hasRealCredentials =
      smtpEmail &&
      smtpPassword &&
      !smtpEmail.includes('your_email') &&
      !smtpPassword.includes('your_app_password');

    if (hasRealCredentials) {
      const config = smtpHost
        ? {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpEmail, pass: smtpPassword },
          }
        : {
            service: 'gmail',
            auth: { user: smtpEmail, pass: smtpPassword },
          };

      transporter = nodemailer.createTransport(config);
      isEtherealAccount = false;
      console.log(`📧 [Mailer] Production SMTP transporter initialized for ${smtpEmail}`);
      try {
        await transporter.verify();
        console.log(`✅ [Mailer] Production SMTP connection verified successfully.`);
      } catch (verifyErr) {
        console.warn(`⚠️ [Mailer] SMTP verification failed (${verifyErr.message}). Transporter will attempt on-demand send.`);
      }
      return transporter;
    }

    // Fallback: Automatic Ethereal Testing Mailer
    try {
      const account = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
      isEtherealAccount = true;
      console.log(`📧 [Mailer] Ethereal test mailer initialized (${account.user})`);
      return transporter;
    } catch (testErr) {
      console.warn(`⚠️ [Mailer] Could not create Ethereal test account: ${testErr.message}. Creating JSON mock transporter.`);
      transporter = nodemailer.createTransport({ jsonTransport: true });
      return transporter;
    }
  })();

  return transporterInitPromise;
}

// Immediately trigger initialization in background
getTransporter().catch((e) => console.warn('[Mailer] Initializer warning:', e.message));

// ── 2. USER AGENT & DEVICE PARSER ──
function parseDeviceAndBrowser(req) {
  const ua = (req && req.headers ? req.headers['user-agent'] : '') || '';
  const rawIp =
    (req && req.headers ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip : '') ||
    '127.0.0.1';
  const clientIp = String(rawIp).split(',')[0].trim().replace(/^::ffff:/, '');

  let browser = 'Modern Web Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome|Chromium/i.test(ua)) browser = 'Apple Safari';
  else if (/OPR\/|Opera\//i.test(ua)) browser = 'Opera';

  let os = 'Desktop Environment';
  if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/i.test(ua)) os = 'Windows PC';
  else if (/iPhone/i.test(ua)) os = 'iOS (Apple iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS (Apple iPad)';
  else if (/Android/i.test(ua)) os = 'Android Mobile';
  else if (/Linux/i.test(ua)) os = 'Linux Workstation';

  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) deviceType = 'Mobile';
  else if (/iPad|Tablet/i.test(ua)) deviceType = 'Tablet';

  const deviceSummary = `${browser} on ${os}`;
  const deviceKey = `${browser}_${os}_${clientIp}`.toLowerCase().replace(/[^a-z0-9_]/g, '');

  return {
    browser,
    os,
    deviceType,
    clientIp,
    deviceSummary,
    deviceKey,
    rawUa: ua,
  };
}

// ── 3. SEND MAIL WITH RETRIES AND AUDIT LOGGING ──
async function sendMailWithRetry(mailOptions, maxRetries = 2) {
  const tp = await getTransporter();
  let attempt = 0;
  let lastErr = null;

  while (attempt <= maxRetries) {
    try {
      const info = await tp.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log(`\n======================================================`);
      console.log(`✉️  [MASTERY ZONE EMAIL DELIVERED]`);
      console.log(`   To:       ${mailOptions.to}`);
      console.log(`   Subject:  ${mailOptions.subject}`);
      console.log(`   MessageId: ${info.messageId || 'MOCK_ID'}`);
      if (previewUrl) {
        console.log(`🔗 PREVIEW REAL INBOX EMAIL HERE:\n   ${previewUrl}`);
      }
      console.log(`======================================================\n`);

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
        isEthereal: isEtherealAccount,
      };
    } catch (err) {
      attempt++;
      lastErr = err;
      console.warn(`[Mailer] Delivery attempt ${attempt} failed for ${mailOptions.to}: ${err.message}`);
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }

  console.error(`❌ [Mailer] Permanent email delivery failure for ${mailOptions.to}:`, lastErr?.message);
  return { success: false, error: lastErr?.message };
}

// Helper: Check if account is a guest account to preserve isolation
function isGuestAccount(email, role) {
  if (role === 'guest') return true;
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  return lower.startsWith('guest_') || (lower.includes('@masteryzone.com') && lower.includes('guest'));
}

// Helper: Format date & time nicely
function formatEmailDateTime(date = new Date()) {
  const d = new Date(date);
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  };
  return d.toLocaleString('en-US', options);
}

// ── 4. BRANDED HTML TEMPLATES ──

// Standard Mastery Zone Base Layout Wrapper
function wrapHtmlEmail({ title, preheader, badgeText, badgeColor = '#4f46e5', badgeBg = '#eef2ff', contentHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      width: 100% !important;
      min-height: 100% !important;
    }
    .wrapper {
      width: 100% !important;
      min-height: 100vh;
      background-color: #f1f5f9;
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .container {
      width: 100% !important;
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
      padding: 36px 36px 30px;
      text-align: center;
      position: relative;
    }
    .brand-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px;
    }
    .brand-tagline {
      color: #c7d2fe;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin: 0;
    }
    .badge {
      display: inline-block;
      margin-top: 16px;
      padding: 6px 16px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 700;
      color: ${badgeColor};
      background-color: ${badgeBg};
      letter-spacing: 0.3px;
    }
    .body {
      padding: 36px 36px 30px;
      background: #ffffff;
    }
    .footer {
      background: #f8fafc;
      padding: 26px 36px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 8px;
    }
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .data-table td {
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .data-table td.label {
      color: #64748b;
      font-weight: 600;
      width: 38%;
      background: #f8fafc;
    }
    .data-table td.val {
      color: #0f172a;
      font-weight: 600;
    }
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
      margin: 16px 0;
    }
    .alert-box {
      border-radius: 12px;
      padding: 16px 18px;
      margin: 20px 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .alert-warning {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .alert-success {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .alert-info {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }
    @media screen and (max-width: 640px) {
      .wrapper {
        padding: 0 !important;
      }
      .container {
        border-radius: 0 !important;
        border: none !important;
        max-width: 100% !important;
      }
      .header {
        padding: 28px 20px !important;
      }
      .body {
        padding: 24px 20px !important;
      }
      .footer {
        padding: 20px 20px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">Mastery Zone</h1>
        <p class="brand-tagline">Learn · Grow · Succeed</p>
        ${badgeText ? `<div class="badge">${badgeText}</div>` : ''}
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p class="footer-text">
          <strong>Mastery Zone Academic & Accreditation Security</strong><br>
          Automated identity verification, proctored audit trails, and multi-factor notifications.
        </p>
        <p class="footer-text" style="font-size: 11px; color: #94a3b8; margin: 0;">
          This is an automated transmission for account security. To adjust email preferences, visit Settings on Mastery Zone.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── 5. EMAIL DELIVERY FUNCTIONS ──

/**
 * Send real-time login notification email
 */
async function sendLoginNotification(user, req, isNewDevice = false) {
  try {
    if (!user || !user.email) return;
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest login (${user.email}) — skipped external email delivery.`);
      return;
    }

    const { browser, os, clientIp, deviceSummary } = parseDeviceAndBrowser(req);
    const candidateName = user.fullName || user.username || 'Candidate';
    const loginTimeStr = formatEmailDateTime(new Date());

    const clientOrigin =
      (req && typeof req.get === 'function' && req.get('origin')) ||
      (req && req.headers && req.headers.origin) ||
      process.env.CLIENT_URL ||
      'http://localhost:5174';
    const resetUrl = `${clientOrigin}/forgot-password`;

    const badgeText = isNewDevice ? '⚠️ New Device Sign-In' : '🛡️ Successful Login';
    const badgeColor = isNewDevice ? '#b45309' : '#15803d';
    const badgeBg = isNewDevice ? '#fef3c7' : '#dcfce7';

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">
        Hello ${candidateName},
      </h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 18px;">
        ${
          isNewDevice
            ? `Your Mastery Zone account was just accessed from a <strong>new device or browser session</strong>.`
            : `We detected a successful login to your Mastery Zone account (${user.email}).`
        }
      </p>

      <table class="data-table">
        <tr>
          <td class="label">Date & Time</td>
          <td class="val">${loginTimeStr}</td>
        </tr>
        <tr>
          <td class="label">Device & OS</td>
          <td class="val">${os}</td>
        </tr>
        <tr>
          <td class="label">Web Browser</td>
          <td class="val">${browser}</td>
        </tr>
        <tr>
          <td class="label">IP Address</td>
          <td class="val">${clientIp}</td>
        </tr>
        <tr>
          <td class="label">Account ID</td>
          <td class="val" style="font-family: monospace;">CAND-${String(user._id || 'ACC').slice(-6).toUpperCase()}</td>
        </tr>
      </table>

      ${
        isNewDevice
          ? `
          <div class="alert-box alert-warning">
            <strong>Security Notice:</strong> If this was you, you can safely disregard this message. If you did not log in from this device, someone else may have gained access to your password. Please lock your account immediately.
          </div>
          `
          : `
          <div class="alert-box alert-info">
            <strong>Security Verified:</strong> If this was you, no action is required. If you do not recognize this sign-in, secure your account right away.
          </div>
          `
      }

      <div style="text-align: center; margin: 24px 0 10px;">
        <a href="${resetUrl}" class="btn-primary" style="background: ${isNewDevice ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'};">
          ${isNewDevice ? 'Not You? Secure Your Account' : 'Manage Account Security'}
        </a>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: isNewDevice ? 'Security Alert: New Sign-In to Mastery Zone' : 'New Sign-In to Your Mastery Zone Account',
      preheader: `Login detected from ${deviceSummary} on ${loginTimeStr}`,
      badgeText,
      badgeColor,
      badgeBg,
      contentHtml,
    });

    const mailOptions = {
      from: `"Mastery Zone Security" <${process.env.SMTP_EMAIL || 'security@masteryzone.com'}>`,
      to: user.email,
      subject: isNewDevice
        ? `[Security Alert] New device sign-in to Mastery Zone`
        : `New sign-in to your Mastery Zone account`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error('Error in sendLoginNotification:', err);
  }
}

/**
 * Send password reset request email with expiring secure link
 */
async function sendPasswordResetEmail(user, resetToken, req, clientOriginOverride = null) {
  try {
    if (!user || !user.email) return;
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest password reset (${user.email}) — skipped external email delivery.`);
      return;
    }

    const candidateName = user.fullName || user.username || 'Candidate';
    const lanIp = getLanIpAddress();
    const networkResetUrl = `http://${lanIp}:5174/reset-password/${resetToken}`;
    const localResetUrl = `http://localhost:5174/reset-password/${resetToken}`;

    // Prefer universal network URL so mobile phones, laptops, and desktops can all reach the page
    let universalResetUrl = networkResetUrl;
    if (clientOriginOverride && !clientOriginOverride.includes('localhost') && !clientOriginOverride.includes('127.0.0.1')) {
      universalResetUrl = `${clientOriginOverride.replace(/\/+$/, '')}/reset-password/${resetToken}`;
    }

    const contentHtml = `
      <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">
        Password Reset Assistance
      </h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 18px;">
        Hello <strong>${candidateName}</strong>, we received a verified request to reset the password associated with your Mastery Zone registered account (<strong>${user.email}</strong>).
      </p>

      <div class="alert-box alert-info">
        ⏱️ <strong>Security Expiration:</strong> This reset link is single-use and will expire in <strong>60 minutes</strong>.
      </div>

      <div style="text-align: center; margin: 28px 0 14px;">
        <a href="${universalResetUrl}" class="btn-primary" style="padding: 15px 36px; font-size: 15px; display: inline-block;">
          Reset Your Password (Phone / PC) →
        </a>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${localResetUrl}" style="color: #4f46e5; font-size: 13px; font-weight: 600; text-decoration: underline;">
          Or open on this computer (Localhost link)
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 6px;">
        Direct Link for all devices (Mobile & Desktop):
      </p>
      <div style="background: #f8fafc; padding: 14px 18px; border-radius: 10px; word-break: break-all; font-family: monospace; font-size: 13px; color: #1e293b; border: 1.5px solid #cbd5e1;">
        <a href="${universalResetUrl}" style="color: #4f46e5; font-weight: 700; text-decoration: underline;">${universalResetUrl}</a>
      </div>

      <div style="margin-top: 16px; padding: 14px 18px; background: #e0e7ff; border-radius: 12px; font-size: 13px; color: #3730a3;">
        🔑 <strong>Reset Security Token:</strong><br>
        <code style="font-weight: 800; font-size: 14px; letter-spacing: 0.6px; word-break: break-all; color: #1e1b4b;">${resetToken}</code>
        <div style="font-size: 11.5px; color: #4338ca; margin-top: 6px;">
          (You can also paste this token or enter your email directly on the Reset Password page on any device)
        </div>
      </div>

      <div class="alert-box alert-warning" style="margin-top: 24px;">
        <strong>Didn't request this?</strong> If you did not request a password reset, you can safely ignore this email. Your password will not change and your account remains secure.
      </div>
    `;

    const html = wrapHtmlEmail({
      title: 'Reset Your Mastery Zone Password',
      preheader: `Password reset link for ${user.email} (expires in 60 minutes)`,
      badgeText: '🔒 Password Assistance',
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff',
      contentHtml,
    });

    const mailOptions = {
      from: `"Mastery Zone Security" <${process.env.SMTP_EMAIL || 'security@masteryzone.com'}>`,
      to: user.email,
      subject: 'Reset your Mastery Zone password',
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error('Error in sendPasswordResetEmail:', err);
  }
}

/**
 * Send real-time signup welcome email notification
 */
async function sendSignupNotification(user, req) {
  try {
    if (!user || !user.email) return;
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest signup (${user.email}) — skipped external email delivery.`);
      return;
    }

    const { browser, os, clientIp, deviceSummary } = parseDeviceAndBrowser(req);
    const candidateName = user.fullName || user.username || 'Candidate';
    const createdAtStr = formatEmailDateTime(user.createdAt || new Date());

    let clientOrigin =
      (req && req.body && req.body.clientOrigin) ||
      (req && typeof req.get === 'function' && req.get('origin')) ||
      (req && req.headers && req.headers.origin) ||
      process.env.CLIENT_URL ||
      'http://localhost:5174';
    clientOrigin = clientOrigin.replace(/\/+$/, '');
    const loginUrl = `${clientOrigin}/login`;

    const badgeText = '🎉 Welcome to Mastery Zone';
    const badgeColor = '#059669';
    const badgeBg = '#d1fae5';

    const contentHtml = `
      <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">
        Welcome to Mastery Zone, ${candidateName}!
      </h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px;">
        Your official Mastery Zone engineering account has been successfully registered. You now have access to structured curricula, real-world algorithmic challenges, full-stack milestone workspaces, and verified proctored certifications.
      </p>

      <table class="data-table">
        <tr>
          <td class="label">Candidate Name</td>
          <td class="val">${candidateName}</td>
        </tr>
        <tr>
          <td class="label">Registered Email</td>
          <td class="val"><strong>${user.email}</strong></td>
        </tr>
        <tr>
          <td class="label">Username</td>
          <td class="val"><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #2563eb; font-weight: 700;">@${user.username}</code></td>
        </tr>
        <tr>
          <td class="label">Registration Date</td>
          <td class="val">${createdAtStr}</td>
        </tr>
        <tr>
          <td class="label">Registered Session</td>
          <td class="val">${deviceSummary}</td>
        </tr>
      </table>

      <div class="alert-box alert-info">
        🛡️ <strong>Strict Account Isolation:</strong> All progress, reports, certificates, and recordings belong exclusively to your individual registered account (${user.email}). Every sign-in and security event sends real-time notifications to this inbox.
      </div>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${loginUrl}" class="btn-primary" style="padding: 14px 34px; font-size: 15px;">
          Log In & Start Learning →
        </a>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: 'Welcome to Mastery Zone — Account Created Successfully',
      preheader: `Welcome ${candidateName}! Your account (${user.email}) is active.`,
      badgeText,
      badgeColor,
      badgeBg,
      contentHtml,
    });

    const mailOptions = {
      from: `"Mastery Zone Security" <${process.env.SMTP_EMAIL || 'security@masteryzone.com'}>`,
      to: user.email,
      subject: 'Welcome to Mastery Zone — Account Created Successfully',
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error('Error in sendSignupNotification:', err);
  }
}

/**
 * Send password reset confirmation email after successful reset
 */
async function sendPasswordResetSuccessEmail(user, req) {
  try {
    if (!user || !user.email) return;
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest password reset confirmation (${user.email}) — skipped.`);
      return;
    }

    const { browser, os, clientIp } = parseDeviceAndBrowser(req);
    const candidateName = user.fullName || user.username || 'Candidate';
    const changeTimeStr = formatEmailDateTime(new Date());

    const clientOrigin =
      (req && typeof req.get === 'function' && req.get('origin')) ||
      (req && req.headers && req.headers.origin) ||
      process.env.CLIENT_URL ||
      'http://localhost:5174';
    const loginUrl = `${clientOrigin}/login`;
    const forgotUrl = `${clientOrigin}/forgot-password`;

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">
        Password Changed Successfully
      </h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 18px;">
        Hello <strong>${candidateName}</strong>, this email confirms that the password for your Mastery Zone account (<strong>${user.email}</strong>) has been successfully changed.
      </p>

      <div class="alert-box alert-success">
        ✅ <strong>Confirmation:</strong> Your new password is now active across all Mastery Zone platforms.
      </div>

      <table class="data-table">
        <tr>
          <td class="label">Date & Time</td>
          <td class="val">${changeTimeStr}</td>
        </tr>
        <tr>
          <td class="label">Device & OS</td>
          <td class="val">${os}</td>
        </tr>
        <tr>
          <td class="label">Web Browser</td>
          <td class="val">${browser}</td>
        </tr>
        <tr>
          <td class="label">IP Address</td>
          <td class="val">${clientIp}</td>
        </tr>
      </table>

      <div class="alert-box alert-warning">
        <strong>Did not change your password?</strong> If you did not make this change, your account may have been compromised. <a href="${forgotUrl}" style="color: #92400e; font-weight: 700; text-decoration: underline;">Reset your password immediately</a> or reach out to our security team.
      </div>

      <div style="text-align: center; margin: 24px 0 10px;">
        <a href="${loginUrl}" class="btn-primary">
          Sign In with New Password
        </a>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: 'Your Mastery Zone Password Was Changed',
      preheader: `Password successfully updated on ${changeTimeStr}`,
      badgeText: '✅ Security Update Confirmed',
      badgeColor: '#15803d',
      badgeBg: '#dcfce7',
      contentHtml,
    });

    const mailOptions = {
      from: `"Mastery Zone Security" <${process.env.SMTP_EMAIL || 'security@masteryzone.com'}>`,
      to: user.email,
      subject: 'Your Mastery Zone password was successfully changed',
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error('Error in sendPasswordResetSuccessEmail:', err);
  }
}

/**
 * Send OTP verification email
 */
async function sendOtpEmail(userEmail, otp) {
  try {
    if (!userEmail) return;
    if (isGuestAccount(userEmail)) return;

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">
        Your Mastery Zone One-Time Code
      </h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 18px;">
        Use the verification code below to sign in or confirm your identity. This code is valid for <strong>10 minutes</strong>.
      </p>

      <div style="text-align: center; padding: 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">
          ${otp}
        </span>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0 0;">
        Never share this verification code with anyone. Mastery Zone representatives will never ask you for your code.
      </p>
    `;

    const html = wrapHtmlEmail({
      title: 'Your Mastery Zone Verification Code',
      preheader: `Your verification code is ${otp}`,
      badgeText: '🔑 Identity Verification',
      badgeColor: '#4f46e5',
      badgeBg: '#eef2ff',
      contentHtml,
    });

    const mailOptions = {
      from: `"Mastery Zone Security" <${process.env.SMTP_EMAIL || 'security@masteryzone.com'}>`,
      to: userEmail,
      subject: `Your Mastery Zone Verification Code: ${otp}`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error('Error in sendOtpEmail:', err);
  }
}

// ── 8. SEND ASSESSMENT & SUBMISSION EVALUATION EMAIL (UNIVERSAL) ──
async function sendSubmissionEvaluationEmail({
  userEmail,
  userName = "Student",
  challengeTitle = "Assessment Evaluation",
  assessmentTitle = "",
  assessmentType = "coding", // "coding" | "module" | "certification"
  language = "Python",
  score = 100,
  maxScore = 100,
  percentage = null,
  verdict = "ACCEPTED",
  adminComment = "",
  reviewedAt = new Date(),
  reportUrl = "",
}) {
  try {
    if (!userEmail) return { success: false, error: "No user email provided" };

    const resolvedTitle = assessmentTitle || challengeTitle;
    const isPassed = verdict === "ACCEPTED" || verdict === "PASSED" || verdict === "Passed" || Number(percentage || score) >= 70;
    const badgeColor = isPassed ? "#059669" : "#d97706";
    const badgeBg = isPassed ? "#ecfdf5" : "#fffbeb";
    const statusText = isPassed ? "PASSED" : verdict;
    const typeLabel = assessmentType === "certification" 
      ? "Professional Certification Exam" 
      : assessmentType === "module" 
      ? "Curriculum Module Assessment" 
      : "Coding Challenge Submission";

    const displayScore = percentage != null 
      ? `${score}/${maxScore} (${percentage}%)` 
      : `${score}/${maxScore}`;

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";
    const resolvedLink = reportUrl ? `${clientUrl}${reportUrl}` : `${clientUrl}/home`;

    const contentHtml = `
      <div style="padding: 18px 0 16px;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          ${typeLabel} Evaluated
        </h2>
        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${userName}</strong>,<br/>
          Your submission for <strong>${resolvedTitle}</strong> has been audited and reviewed by the MasteryZone Administrator.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assessment:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${resolvedTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Type:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${typeLabel}</td>
            </tr>
            ${assessmentType === "coding" ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Language:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right; text-transform: uppercase;">${language}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Awarded Score:</td>
              <td style="padding: 6px 0; color: ${badgeColor}; font-weight: 800; font-size: 16px; text-align: right;">${displayScore}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Evaluation Status:</td>
              <td style="padding: 6px 0; text-align: right;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; background: ${badgeBg}; color: ${badgeColor};">
                  ${statusText}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Evaluation Date:</td>
              <td style="padding: 6px 0; color: #64748b; text-align: right;">${formatEmailDateTime(reviewedAt)}</td>
            </tr>
          </table>
        </div>

        ${adminComment ? `
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 8px; margin-bottom: 22px;">
            <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase;">
              Admin Evaluation Remarks & Feedback:
            </p>
            <p style="margin: 0; font-size: 13.5px; color: #1e3a8a; line-height: 1.5; font-style: italic;">
              "${adminComment}"
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 26px 0 12px;">
          <a href="${resolvedLink}" 
             style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
            View Verified Assessment Report →
          </a>
        </div>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: `${typeLabel} Evaluated: ${resolvedTitle}`,
      preheader: `Your result for ${resolvedTitle} is now available (${displayScore})`,
      badgeText: `📋 Official Evaluation: ${statusText}`,
      badgeColor,
      badgeBg,
      contentHtml,
    });

    const mailOptions = {
      from: `"MasteryZone Academics" <${process.env.SMTP_EMAIL || 'support@masteryzone.com'}>`,
      to: userEmail,
      subject: `[MasteryZone] Score Updated: ${resolvedTitle} (${displayScore} - ${statusText})`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error("sendSubmissionEvaluationEmail error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches 6-digit verification OTP to Main Admin for Admin Management access
 */
async function sendMainAdminOtpEmail({ toEmail, otp, expiresMinutes = 10 }) {
  try {
    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Main Administrator Security Verification
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          You requested access to the <strong>Admin Management & Delegation Controls</strong> on MasteryZone.
          Enter the single-use 6-digit verification code below to authorize this session:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 16px 36px; background: #ede9fe; border: 2px dashed #8b5cf6; border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: 900; color: #5b21b6; font-family: monospace;">
            ${otp}
          </div>
        </div>

        <div style="padding: 12px 16px; background: #fffbeb; border-radius: 8px; border: 1px solid #fef3c7; color: #92400e; font-size: 12.5px; margin-bottom: 20px;">
          ⏱️ <strong>Security Notice:</strong> This OTP is strictly confidential, single-use, and expires in <strong>${expiresMinutes} minutes</strong>. If you did not initiate this request, your account may be under reconnaissance — change your password immediately.
        </div>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: "MasteryZone Admin Verification Code",
      preheader: `Your single-use 6-digit verification code: ${otp}`,
      badgeText: "🛡️ Main Admin Two-Factor Auth",
      badgeColor: "#6366f1",
      badgeBg: "#ede9fe",
      contentHtml,
    });

    const mailOptions = {
      from: `"MasteryZone Security" <${process.env.SMTP_EMAIL || "security@masteryzone.com"}>`,
      to: toEmail,
      subject: `[MasteryZone Security] ${otp} is your Admin Management Verification Code`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error("sendMainAdminOtpEmail error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches welcome email with initial temporary credentials to newly created Administrator
 */
async function sendNewAdminWelcomeEmail({ adminEmail, adminName, tempPassword, permissions = [], loginUrl = "http://localhost:5174/login" }) {
  try {
    const permsList = permissions.includes("*")
      ? "Full Administrative Access"
      : permissions.join(", ");

    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Welcome to MasteryZone Administration
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${adminName}</strong>,<br/>
          You have been designated as an Administrator for the <strong>MasteryZone Academic Platform</strong> by the Main Administrator.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Admin Portal:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">MasteryZone Admin Portal</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Login Email:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${adminEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Temporary Password:</td>
              <td style="padding: 6px 0; text-align: right;">
                <code style="background: #ede9fe; color: #5b21b6; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 14px;">${tempPassword}</code>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assigned Permissions:</td>
              <td style="padding: 6px 0; color: #334155; font-weight: 600; text-align: right;">${permsList}</td>
            </tr>
          </table>
        </div>

        <div style="padding: 12px 16px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; color: #991b1b; font-size: 12.5px; margin-bottom: 22px;">
          ⚠️ <strong>Mandatory Security Action:</strong> For platform compliance and account integrity, you will be required to change your password upon your first sign in.
        </div>

        <div style="text-align: center; margin: 26px 0 12px;">
          <a href="${loginUrl}" 
             style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
            Access MasteryZone Admin Portal →
          </a>
        </div>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: "MasteryZone Administrator Account Created",
      preheader: `Your administrator credentials for ${adminEmail}`,
      badgeText: "👔 Administrative Credentials",
      badgeColor: "#4f46e5",
      badgeBg: "#eef2ff",
      contentHtml,
    });

    const mailOptions = {
      from: `"MasteryZone Security" <${process.env.SMTP_EMAIL || "security@masteryzone.com"}>`,
      to: adminEmail,
      subject: `[MasteryZone] Administrator Account Credentials Created (${adminEmail})`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error("sendNewAdminWelcomeEmail error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches confirmation notification when an administrator's credentials are reset/updated
 */
async function sendAdminPasswordChangedEmail({ adminEmail, adminName, changedBy = "Main Administrator" }) {
  try {
    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Administrator Password Updated
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${adminName}</strong>,<br/>
          Your password for the <strong>MasteryZone Administrator Account</strong> was recently modified by <strong>${changedBy}</strong> on ${new Date().toLocaleString()}.
        </p>

        <div style="padding: 12px 16px; background: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; color: #065f46; font-size: 13px; margin-bottom: 20px;">
          ✅ <strong>Security Status:</strong> If you requested this update, no further action is necessary. You may now sign in using your updated credentials.
        </div>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: "MasteryZone Administrator Password Updated",
      preheader: `Security notice regarding password update for ${adminEmail}`,
      badgeText: "🔑 Password Update Notice",
      badgeColor: "#059669",
      badgeBg: "#ecfdf5",
      contentHtml,
    });

    const mailOptions = {
      from: `"MasteryZone Security" <${process.env.SMTP_EMAIL || "security@masteryzone.com"}>`,
      to: adminEmail,
      subject: `[Security Notice] Administrator Password Modified (${adminEmail})`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error("sendAdminPasswordChangedEmail error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches email confirmation when a user submits a support ticket
 */
async function sendSupportTicketSubmittedEmail({
  userEmail,
  userName,
  ticketId,
  category,
  subject,
  description,
  priority = "Medium",
  ticketUrl = "http://localhost:5174/help",
}) {
  try {
    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Support Ticket Received: ${ticketId}
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${userName}</strong>,<br/>
          Thank you for reaching out to MasteryZone Support. Your issue has been logged and assigned to our technical engineering team for review.
        </p>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ticket ID:</td>
              <td style="padding: 6px 0; color: #4338ca; font-weight: 800; font-family: monospace;">${ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Category:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Subject:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Priority:</td>
              <td style="padding: 6px 0; color: ${priority === "Critical" ? "#dc2626" : priority === "High" ? "#ea580c" : "#2563eb"}; font-weight: 700;">${priority}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Initial Status:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: 700;">Submitted (Under Review)</td>
            </tr>
          </table>
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #475569; line-height: 1.5;">
            <strong>Problem Description:</strong><br/>
            ${description.replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0 10px;">
          <a href="${ticketUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
            View Ticket & Live Status
          </a>
        </div>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: `[Support Ticket ${ticketId}] ${subject}`,
      preheader: `We received your support ticket regarding ${category}.`,
      badgeText: "🎫 Support Request Submitted",
      badgeColor: "#4f46e5",
      badgeBg: "#eef2ff",
      contentHtml,
    });

    const mailOptions = {
      from: `"MasteryZone Support" <${process.env.SMTP_EMAIL || "support@masteryzone.com"}>`,
      to: userEmail,
      subject: `[Ticket ${ticketId}] Issue Logged: ${subject}`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error("sendSupportTicketSubmittedEmail error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches email notification when an administrator writes a response or updates ticket status
 */
async function sendSupportTicketResponseEmail({
  userEmail,
  userName,
  ticketId,
  category,
  subject,
  adminResponse,
  status = "In Progress",
  respondedBy = "MasteryZone Support Team",
  ticketUrl = "http://localhost:5174/help",
}) {
  try {
    const isResolved = status === "Resolved";
    const statusColor = isResolved ? "#059669" : "#2563eb";
    const statusBg = isResolved ? "#ecfdf5" : "#eff6ff";

    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          ${isResolved ? "🎉 Support Ticket Resolved" : "💬 New Response from Support"}
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${userName}</strong>,<br/>
          An administrator has reviewed your support ticket <strong>${ticketId}</strong> and provided an official response.
        </p>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ticket ID:</td>
              <td style="padding: 6px 0; color: #4338ca; font-weight: 800; font-family: monospace;">${ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Category:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Subject:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Current Status:</td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
                  ${status}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Responded By:</td>
              <td style="padding: 6px 0; color: #334155; font-weight: 600;">${respondedBy}</td>
            </tr>
          </table>

          <div style="margin-top: 16px; padding: 14px 16px; background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px; font-size: 13.5px; color: #1e293b; line-height: 1.6;">
            <strong>Administrator Message:</strong><br/>
            ${adminResponse.replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0 10px;">
          <a href="${ticketUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
            Open Support Ticket in MasteryZone
          </a>
        </div>
      </div>
    `;

    const html = wrapHtmlEmail({
      title: `[Update: ${ticketId}] ${isResolved ? "Issue Resolved" : "Admin Response"}`,
      preheader: `Support update for ticket ${ticketId}: ${isResolved ? "Your issue is marked Resolved." : "An administrator responded."}`,
      badgeText: isResolved ? "✅ Issue Resolved" : "💬 Support Update",
      badgeColor: statusColor,
      badgeBg: statusBg,
      contentHtml,
    });

    const mailOptions = {
      from: `"MasteryZone Support" <${process.env.SMTP_EMAIL || "support@masteryzone.com"}>`,
      to: userEmail,
      subject: `[Update: ${ticketId}] ${isResolved ? "Issue Resolved" : "New Admin Response"}: ${subject}`,
      html,
    };

    return await sendMailWithRetry(mailOptions);
  } catch (err) {
    console.error("sendSupportTicketResponseEmail error:", err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getTransporter,
  parseDeviceAndBrowser,
  sendSignupNotification,
  sendLoginNotification,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendOtpEmail,
  sendSubmissionEvaluationEmail,
  sendMainAdminOtpEmail,
  sendNewAdminWelcomeEmail,
  sendAdminPasswordChangedEmail,
  sendSupportTicketSubmittedEmail,
  sendSupportTicketResponseEmail,
};
