const nodemailer = require('nodemailer');
const path = require('path');
const os = require('os');
const fs = require('fs');
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

let transporterInstance = null;
let transporterInitPromise = null;

function resetTransporter() {
  if (transporterInstance) {
    try {
      transporterInstance.close();
    } catch {}
  }
  transporterInstance = null;
  transporterInitPromise = null;
}

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const rawPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
  const port = rawPort || (process.env.SMTP_SECURE === 'false' ? 587 : 465);
  const isSecure = port === 465 ? true : (port === 587 ? false : process.env.SMTP_SECURE === 'true');

  const email = (process.env.SMTP_EMAIL || process.env.EMAIL_USER || '').trim();
  const password = (process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
  const defaultFrom = process.env.SMTP_FROM || `"Mastery Zone" <${email || 'notifications@masteryzone.com'}>`;

  const isConfigured = Boolean(
    email &&
    password &&
    !email.includes('your_email') &&
    !password.includes('your_app_password')
  );

  return {
    host,
    port,
    secure: isSecure,
    email,
    password,
    auth: {
      user: email,
      pass: password,
    },
    from: defaultFrom,
    isConfigured,
  };
}

function getSenderAddress(department = 'Mastery Zone') {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);
  const config = getSmtpConfig();
  const senderEmail = (
    process.env.RESEND_FROM ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.SMTP_FROM ||
    config.email ||
    process.env.SMTP_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.MAIN_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ''
  ).trim();

  let cleanEmail = senderEmail;
  const match = senderEmail.match(/<([^>]+)>/);
  if (match) cleanEmail = match[1].trim();

  if (!cleanEmail || cleanEmail.toLowerCase().endsWith('@masteryzone.com') || cleanEmail.toLowerCase().endsWith('@masteryzone.test')) {
    const verifiedFallback = (
      process.env.BREVO_SENDER_EMAIL ||
      process.env.SMTP_EMAIL ||
      config.email ||
      process.env.MAIN_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      ''
    ).trim();
    if (verifiedFallback && !verifiedFallback.toLowerCase().endsWith('@masteryzone.com') && !verifiedFallback.toLowerCase().endsWith('@masteryzone.test')) {
      cleanEmail = verifiedFallback;
    } else if (!isTrustedLocal) {
      return null;
    } else {
      cleanEmail = 'notifications@masteryzone.com';
    }
  }

  return `"${department}" <${cleanEmail}>`;
}

const sentNotificationCache = new Map();
const DEDUP_WINDOW_MS = 15000;

function getOutboundEmailDedupKey(to, subject, html, options = {}) {
  const cleanTo = (Array.isArray(to) ? to.join(",") : String(to)).toLowerCase().trim();
  const cleanSubject = String(subject || "").trim().toLowerCase();
  const emailType = options.emailType || "";
  const recordId = options.recordId || "";
  if (recordId || emailType) {
    return `${cleanTo}::${emailType}::${recordId || cleanSubject}`;
  }
  const sample = (html || "").slice(0, 80);
  return `${cleanTo}::${cleanSubject}::${sample}`;
}

function isDuplicateOutboundEmail(to, subject, html, options = {}) {
  const key = getOutboundEmailDedupKey(to, subject, html, options);
  const now = Date.now();
  const lastSent = sentNotificationCache.get(key);
  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
    return true;
  }
  if (options.checkOnly) {
    return false;
  }
  if (sentNotificationCache.size > 200) {
    for (const [k, ts] of sentNotificationCache) {
      if (now - ts > DEDUP_WINDOW_MS * 2) {
        sentNotificationCache.delete(k);
      }
    }
  }
  sentNotificationCache.set(key, now);
  return false;
}

function markOutboundEmailSent(to, subject, html, options = {}) {
  const key = getOutboundEmailDedupKey(to, subject, html, options);
  const now = Date.now();
  if (sentNotificationCache.size > 200) {
    for (const [k, ts] of sentNotificationCache) {
      if (now - ts > DEDUP_WINDOW_MS * 2) {
        sentNotificationCache.delete(k);
      }
    }
  }
  sentNotificationCache.set(key, now);
}

function clearSentNotificationCache() {
  sentNotificationCache.clear();
}

function validateRecipientEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(trimmed);
}

// ── Synthetic, Test & Non-Deliverable Domain Blacklist ──
// These domains have no genuine mailboxes or are reserved by RFC 2606 for documentation/testing.
const NON_DELIVERABLE_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'test.com',
  'test.net',
  'test.org',
  'invalid',
  'localhost',
  'masteryzone.test',
  'mailinator.com',
  'tempmail.com',
  'throwawaymail.com',
  '10minutemail.com',
  'guerrillamail.com',
]);

// Test and placeholder recipient patterns created by automated test runners, guest sessions, or seed scripts
const NON_DELIVERABLE_PATTERNS = [
  /^guest[_-]/i,
  /^visitor[_-]/i,
  /^temp[_-]/i,
  /isolation/i,
  /isolated/i,
  /^testcandidate/i,
  /^admintester/i,
  /^candidate_.*_sec/i,
  /^rec_(host|attacker|admin)/i,
  /^user_[ab]_(critical|tester)/i,
  /^integration\.user/i,
  /^dummy/i,
  /^fake/i,
  /^hacker@/i,
  /^outsider@/i,
];

/**
 * Validates that an address is a genuine, deliverable user recipient.
 * Eliminates automated test spam (e.g., user_isolated@masteryzone.com, usera_isolation@masteryzone.com),
 * disposable inboxes, guest identifiers, and internal placeholders.
 */
function isLegitimateDeliverableEmail(email, role = null) {
  if (role === 'guest') return false;
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.toLowerCase().trim();
  if (!validateRecipientEmail(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;

  const env = (process.env.NODE_ENV || "").trim().toLowerCase();

  // Block reserved and disposable domains
  if (NON_DELIVERABLE_DOMAINS.has(domain) || domain.endsWith('.test') || domain.endsWith('.invalid')) {
    // In automated test environments, allow RFC example domains for in-memory mocked transport assertions
    if (env === 'test' && (domain === 'example.com' || domain === 'example.org' || domain === 'example.net')) {
      return true;
    }
    return false;
  }

  // The application domain @masteryzone.com is an internal platform brand domain.
  // There are no public user inboxes hosted on @masteryzone.com.
  // Real administrators use their verified email addresses (e.g. yashashyashash1@gmail.com).
  // Any user with an @masteryzone.com email is a synthetic account or test fixture.
  if (domain === 'masteryzone.com') {
    const adminEmail = (process.env.MAIN_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    if (adminEmail && trimmed === adminEmail) {
      return true; // Configured admin override if applicable
    }
    if (env === 'test' && trimmed === 'admin@masteryzone.com') {
      return true; // Mock test administrator recipient
    }
    return false;
  }

  // Block automated test fixtures and seed patterns
  for (const pattern of NON_DELIVERABLE_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(localPart)) {
      return false;
    }
  }

  return true;
}

function sanitizeLogMessage(msg) {
  if (!msg) return "";
  return String(msg)
    .replace(/(re_[a-zA-Z0-9_]{20,})/g, "[REDACTED_API_KEY]")
    .replace(/(xkeysib-[a-zA-Z0-9]{30,})/g, "[REDACTED_API_KEY]")
    .replace(/(Bearer\s+)[^\s]+/gi, "$1[REDACTED_TOKEN]");
}

const TRUSTED_LOCAL_ENVS = new Set(["development", "test"]);

/**
 * Detects whether an HTTPS transactional email provider is configured.
 * Cloud platforms (specifically Render Free Tier) completely block outbound
 * TCP traffic on SMTP ports 25, 465, and 587. Using an HTTPS API (Port 443)
 * bypasses cloud firewall restrictions without requiring paid infrastructure.
 */
function getHttpEmailProvider() {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);

  // In automated test environments, never call real third-party HTTP email APIs unless explicitly requested
  if (env === 'test' && process.env.ENABLE_REAL_TEST_DISPATCH !== 'true') {
    return null;
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    let from = process.env.RESEND_FROM ? process.env.RESEND_FROM.trim() : "";
    const isTestSender = !from || from.includes("onboarding@resend.dev");

    if (!isTrustedLocal && isTestSender) {
      console.warn(
        "[Mailer] PRODUCTION CONFIGURATION WARNING: RESEND_FROM is unconfigured or using sandbox sender 'onboarding@resend.dev'. " +
        "Resend sandbox senders only deliver to the account owner. Configure a verified sender domain in RESEND_FROM for live deliverability."
      );
    }

    if (!from) {
      from = 'Mastery Zone <onboarding@resend.dev>';
    }

    return {
      type: 'resend',
      apiKey: process.env.RESEND_API_KEY.trim(),
      from,
      isTestSender,
    };
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    const verifiedEmail = (
      process.env.BREVO_SENDER_EMAIL ||
      process.env.SMTP_FROM ||
      process.env.SMTP_EMAIL ||
      process.env.EMAIL_USER ||
      process.env.MAIN_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      ""
    ).trim();

    let cleanEmail = verifiedEmail;
    const match = verifiedEmail.match(/<([^>]+)>/);
    if (match) cleanEmail = match[1].trim();

    if (!cleanEmail) {
      if (!isTrustedLocal) {
        return null;
      }
      cleanEmail = 'notifications@masteryzone.com';
    }

    return {
      type: 'brevo',
      apiKey: process.env.BREVO_API_KEY.trim(),
      from: `Mastery Zone <${cleanEmail}>`,
    };
  }
  return null;
}

async function sendViaHttpApi(mailOptions, provider) {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);
  const to = Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to];
  const cleanTo = to.map((e) => String(e).trim().toLowerCase());

  if (provider.type === 'resend') {
    if (provider.isTestSender && !isTrustedLocal) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'ECONFIG',
        error: "Production email requires an explicitly configured verified sender domain via RESEND_FROM. Sandbox sender 'onboarding@resend.dev' is rejected in production/deployed environments.",
      };
    }

    // When using Resend without a custom verified domain, any 'from' address using
    // @gmail.com, @yahoo.com, etc. will be rejected by Resend with HTTP 403 (domain not verified).
    // Always enforce provider.from ('onboarding@resend.dev') unless RESEND_FROM was explicitly configured.
    let sender = provider.from;
    if (process.env.RESEND_FROM && mailOptions.from && !/@(gmail|googlemail|yahoo|hotmail|outlook)\.com/i.test(mailOptions.from)) {
      sender = mailOptions.from;
    }

    const payload = {
      from: sender,
      to: cleanTo,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    };
    if (process.env.SMTP_EMAIL) {
      payload.reply_to = process.env.SMTP_EMAIL;
    }
    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
      const fs = require('fs');
      payload.attachments = mailOptions.attachments.map((att) => {
        let content = att.content;
        if (!content && att.path && fs.existsSync(att.path)) {
          content = fs.readFileSync(att.path).toString('base64');
        } else if (Buffer.isBuffer(content)) {
          content = content.toString('base64');
        }
        return {
          filename: att.filename,
          content,
        };
      }).filter((att) => att.content);
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      return {
        success: true,
        status: 'accepted',
        messageId: data.id,
        accepted: cleanTo,
        rejected: [],
        providerResponse: `250 Resend API ID ${data.id}`,
      };
    }

    const rawMsg = data.message || `Resend API returned status ${res.status}`;
    console.error('[Mailer Resend Error]', res.status, data);
    const err = new Error(rawMsg);
    err.code = res.status === 401 ? 'EAUTH' : 'ERESEND';
    err.providerMessage = rawMsg;
    err.status = res.status;
    throw err;
  }

  if (provider.type === 'brevo') {
    let fromEmail = (
      process.env.BREVO_SENDER_EMAIL ||
      process.env.SMTP_FROM ||
      process.env.SMTP_EMAIL ||
      process.env.EMAIL_USER ||
      process.env.MAIN_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      ""
    ).trim();
    let match = fromEmail.match(/<([^>]+)>/);
    if (match) fromEmail = match[1].trim();
    if (!fromEmail && isTrustedLocal) {
      fromEmail = "notifications@masteryzone.com";
    }
    let fromName = 'Mastery Zone';

    if (mailOptions.from) {
      const matchName = String(mailOptions.from).match(/"?([^"<]+)"?\s*<[^>]+>/);
      if (matchName && matchName[1].trim()) fromName = matchName[1].trim();

      const matchEmail = String(mailOptions.from).match(/<([^>]+)>/);
      if (matchEmail && matchEmail[1].trim()) {
        const candidate = matchEmail[1].trim().toLowerCase();
        if (!candidate.endsWith('@masteryzone.com') && candidate.includes('@')) {
          fromEmail = candidate;
        }
      }
    }

    if (!fromEmail && !isTrustedLocal) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'ECONFIG',
        error: 'Production email via Brevo requires an explicitly configured verified sender address in BREVO_SENDER_EMAIL or SMTP_FROM.',
      };
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: cleanTo.map((e) => ({ email: e })),
        subject: mailOptions.subject,
        htmlContent: mailOptions.html,
        ...(mailOptions.text ? { textContent: mailOptions.text } : {}),
        replyTo: { email: fromEmail, name: fromName },
      }),
    });

    const data = await res.json().catch(() => ({}));
    const messageId = data.messageId || (Array.isArray(data.messageIds) && data.messageIds[0]);
    if (res.ok && messageId) {
      return {
        success: true,
        status: 'accepted',
        messageId: String(messageId).trim(),
        accepted: cleanTo,
        rejected: [],
        providerResponse: `250 Brevo API Accepted ID ${messageId}`,
      };
    }
    const errMsg = data.message || `Brevo API returned status ${res.status}`;
    const err = new Error(errMsg);
    err.code = res.status === 401 ? 'EAUTH' : 'API_ERROR';
    err.providerMessage = errMsg;
    throw err;
  }

  throw new Error('Unsupported HTTP email provider');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user.charAt(0)}***@${domain}`;
  return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
}

function diagnoseSmtpError(err) {
  if (!err) return { code: 'UNKNOWN', message: 'Unknown mailer error' };
  const rawMsg = err.providerMessage || err.message || '';
  const lowerMsg = rawMsg.toLowerCase();

  // If the error originated from an HTTPS API provider (Resend, Brevo, etc.)
  if (err.code === 'ERESEND' || err.code === 'API_ERROR' || lowerMsg.includes('resend') || lowerMsg.includes('brevo')) {
    if (err.code === 'EAUTH' || lowerMsg.includes('api key') || lowerMsg.includes('unauthorized') || lowerMsg.includes('forbidden') || lowerMsg.includes('401')) {
      return {
        code: 'EAUTH',
        message: 'Resend API authentication failed. Verify that your RESEND_API_KEY in Render Environment is active and valid.',
      };
    }
    return {
      code: err.code || 'API_ERROR',
      message: `Email delivery provider notice: ${rawMsg}`,
    };
  }

  const code = err.code || 
    (lowerMsg.includes('timed out') || lowerMsg.includes('timeout') ? 'ETIMEDOUT' :
     lowerMsg.includes('535') || lowerMsg.includes('auth') ? 'EAUTH' : 'SMTP_ERROR');

  let safeMessage = 'SMTP communication error.';

  if (code === 'ECONFIG') {
    safeMessage = 'SMTP configuration is missing or incomplete. Ensure SMTP_EMAIL and SMTP_PASSWORD are set.';
  } else if (code === 'EAUTH' || rawMsg.includes('535') || rawMsg.includes('Username and Password not accepted')) {
    safeMessage = 'SMTP Authentication failed. If using Gmail, verify that 2-Step Verification is active and you are using a 16-character Google App Password (not your personal account password).';
  } else if (code === 'EENVELOPE' || rawMsg.includes('550') || rawMsg.includes('553')) {
    safeMessage = 'Recipient or sender address was rejected by the mail server.';
  } else if (code === 'ETIMEDOUT') {
    safeMessage = 'Connection to SMTP server timed out. Check network connectivity and port settings.';
  } else if (code === 'ECONNECTION' || code === 'ESOCKET') {
    safeMessage = 'Failed to establish an outbound network connection to the SMTP server. Note: Cloud providers like Render Free Tier block outbound SMTP ports 25, 465, and 587. To send emails on Render Free Tier, add RESEND_API_KEY (HTTPS Port 443) in your Environment variables, or upgrade Render to lift the port restriction.';
  } else if (code === 'ETLS') {
    safeMessage = 'TLS negotiation failed. Verify port and security settings (port 465 for SSL/TLS or 587 for STARTTLS).';
  } else {
    safeMessage = `SMTP error: ${rawMsg.slice(0, 150)}`;
  }

  return {
    code,
    message: safeMessage,
  };
}

// ── 1. INITIALIZE TRANSPORTER (STRICT REAL SMTP ONLY) ──
function getTransporter() {
  if (transporterInstance) return Promise.resolve(transporterInstance);
  if (transporterInitPromise) return transporterInitPromise;

  transporterInitPromise = (async () => {
    const config = getSmtpConfig();

    if (!config.isConfigured) {
      const err = new Error('SMTP credentials are not configured. Please set SMTP_EMAIL and SMTP_PASSWORD in your environment.');
      err.code = 'ECONFIG';
      transporterInitPromise = null;
      throw err;
    }

    // In automated test environments, default to jsonTransport unless real dispatch is explicitly requested.
    // If a test suite monkey-patches nodemailer.createTransport, its custom mock is invoked cleanly.
    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_REAL_TEST_DISPATCH !== 'true') {
      try {
        transporterInstance = nodemailer.createTransport({ jsonTransport: true });
        return transporterInstance;
      } catch (err) {
        transporterInitPromise = null;
        throw err;
      }
    }

    try {
      const transportOptions = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.email,
          pass: config.password,
        },
        family: 4, // Force IPv4 resolution to prevent cloud host IPv6 timeouts on Render/Docker
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        idleTimeout: 30000,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      };

      transporterInstance = nodemailer.createTransport(transportOptions);
      console.log(`📧 [Mailer] Production SMTP pooled transporter initialized for ${config.email} (${config.host}:${config.port})`);
      return transporterInstance;
    } catch (err) {
      transporterInitPromise = null;
      throw err;
    }
  })();

  return transporterInitPromise;
}

/**
 * Explicit health check verifying live SMTP connection and authentication
 */
async function verifySmtpConnection() {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);
  const config = getSmtpConfig();

  // 1. If primary SMTP is configured, verify live SMTP connection first
  if (config.isConfigured) {
    try {
      const tp = await getTransporter();
      await tp.verify();
      return {
        success: true,
        ok: true,
        status: 'connected',
        provider: 'smtp',
        configured: true,
        connected: true,
        host: config.host,
        port: config.port,
        secure: config.secure,
        sender: config.from,
        user: maskEmail(config.email),
        message: 'SMTP connection verified successfully and ready for dispatch.',
      };
    } catch (err) {
      console.warn(`[Mailer] Primary SMTP verification error: ${err.message}`);
      // If port 465 hit a network/socket error on cloud host, transparently try port 587 (STARTTLS, IPv4)
      if ((err.code === 'ESOCKET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') && config.port === 465) {
        try {
          console.log(`ℹ️ [Mailer] Port 465 hit ${err.code} on cloud host; attempting fallback to Port 587 (STARTTLS, IPv4)...`);
          const fallbackOptions = {
            host: config.host,
            port: 587,
            secure: false,
            auth: {
              user: config.email,
              pass: config.password,
            },
            family: 4,
            pool: true,
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
          };
          const altTp = nodemailer.createTransport(fallbackOptions);
          await altTp.verify();
          transporterInstance = altTp;
          console.log(`✅ [Mailer] Port 587 (STARTTLS) verified and established as active transporter.`);
          return {
            success: true,
            ok: true,
            status: 'connected',
            provider: 'smtp',
            configured: true,
            connected: true,
            host: config.host,
            port: 587,
            secure: false,
            sender: config.from,
            user: maskEmail(config.email),
            message: 'SMTP connection verified successfully on port 587 (STARTTLS) and ready for dispatch.',
          };
        } catch (altErr) {
          console.warn(`[Mailer] Fallback to port 587 also failed:`, altErr.message);
        }
      }
    }
  }

  // 2. If SMTP is unconfigured or blocked by cloud firewall, check HTTPS API provider (Port 443)
  const httpProvider = getHttpEmailProvider();
  if (httpProvider) {
    if (httpProvider.type === 'resend' && httpProvider.isTestSender && !isTrustedLocal) {
      return {
        success: false,
        ok: false,
        status: 'unconfigured',
        provider: 'resend',
        configured: false,
        connected: false,
        errorCode: 'ECONFIG',
        message: "Production email requires an explicitly configured verified sender domain via RESEND_FROM. Sandbox sender 'onboarding@resend.dev' is rejected in production/deployed environments.",
      };
    }
    try {
      if (httpProvider.type === 'resend') {
        const res = await fetch('https://api.resend.com/api-keys', {
          headers: { Authorization: `Bearer ${httpProvider.apiKey}` },
        });
        const data = await res.json().catch(() => ({}));
        const errName = String(data?.name || data?.message || '').toLowerCase();
        // A send-only restricted Resend key returns 401/403 with restricted_api_key on /api-keys, which is valid for sending
        const isRestrictedValidKey = (res.status === 401 || res.status === 403) && errName.includes('restricted');
        if (res.ok || isRestrictedValidKey) {
          return {
            success: true,
            ok: true,
            status: 'connected',
            provider: 'resend',
            configured: true,
            connected: true,
            host: 'api.resend.com (HTTPS Port 443)',
            port: 443,
            secure: true,
            sender: httpProvider.from,
            user: 'Resend API Key',
            message: 'Resend HTTPS API connection verified and ready for dispatch.',
          };
        }
        if (!config.isConfigured) {
          return {
            success: false,
            ok: false,
            status: 'failed',
            provider: 'resend',
            configured: true,
            connected: false,
            host: 'api.resend.com (HTTPS Port 443)',
            port: 443,
            secure: true,
            sender: httpProvider.from,
            user: 'Resend API Key',
            errorCode: res.status === 401 || res.status === 403 ? 'EAUTH' : 'EPROVIDER',
            message: sanitizeLogMessage(data?.message || `Resend API verification failed with HTTP ${res.status}.`),
          };
        }
      } else if (httpProvider.type === 'brevo') {
        const res = await fetch('https://api.brevo.com/v3/account', {
          headers: { 'api-key': httpProvider.apiKey },
        });
        if (res.ok) {
          return {
            success: true,
            ok: true,
            status: 'connected',
            provider: 'brevo',
            configured: true,
            connected: true,
            host: 'api.brevo.com (HTTPS Port 443)',
            port: 443,
            secure: true,
            sender: httpProvider.from,
            user: 'Brevo API Key',
            message: 'Brevo HTTPS API connection verified and ready for dispatch.',
          };
        }
        if (!config.isConfigured) {
          return {
            success: false,
            ok: false,
            status: 'failed',
            provider: 'brevo',
            configured: true,
            connected: false,
            host: 'api.brevo.com (HTTPS Port 443)',
            port: 443,
            secure: true,
            sender: httpProvider.from,
            user: 'Brevo API Key',
            errorCode: res.status === 401 || res.status === 403 ? 'EAUTH' : 'EPROVIDER',
            message: `Brevo API verification failed with HTTP ${res.status}.`,
          };
        }
      }
    } catch (e) {
      console.warn('[Mailer] HTTP Provider connection check error:', e.message);
      if (!config.isConfigured) {
        return {
          success: false,
          ok: false,
          status: 'failed',
          provider: httpProvider.type,
          configured: true,
          connected: false,
          host: httpProvider.type === 'resend' ? 'api.resend.com' : 'api.brevo.com',
          port: 443,
          secure: true,
          sender: httpProvider.from,
          errorCode: 'ECONNECTION',
          message: sanitizeLogMessage(e.message || 'HTTP email provider connection failed'),
        };
      }
    }
  }

  if (!config.isConfigured) {
    return {
      success: false,
      ok: false,
      status: 'unconfigured',
      provider: 'smtp',
      configured: false,
      connected: false,
      host: config.host,
      port: config.port,
      secure: config.secure,
      sender: config.from,
      user: config.email ? maskEmail(config.email) : null,
      errorCode: 'ECONFIG',
      message: 'SMTP credentials missing. Please set SMTP_EMAIL and SMTP_PASSWORD (or RESEND_API_KEY) in environment variables.',
    };
  }

  const diag = diagnoseSmtpError({ code: 'ECONNECTION', message: 'Unable to connect to SMTP server' });
  return {
    success: false,
    ok: false,
    status: 'failed',
    provider: 'smtp',
    configured: true,
    connected: false,
    host: config.host,
    port: config.port,
    secure: config.secure,
    sender: config.from,
    user: maskEmail(config.email),
    errorCode: diag.code,
    message: diag.message,
  };
}

// Check SMTP connection in background on boot
verifySmtpConnection().then((res) => {
  if (res.success) {
    console.log(`✅ [Mailer] SMTP connection verified for ${res.user}`);
  } else {
    console.warn(`⚠️ [Mailer] SMTP status: ${res.message} (${res.errorCode || 'UNCONFIGURED'})`);
  }
}).catch(() => {});

async function recordEmailLog(data) {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return null;
    }
    const EmailLog = require('../models/EmailLog');
    return await EmailLog.create({
      ...data,
      lastAttemptedAt: new Date(),
    });
  } catch {
    return null;
  }
}

// ── 2. SEND MAIL WITH RETRY, TIMEOUT PROTECTION AND AUDIT LOGGING ──
async function sendMailWithRetry(mailOptions, maxRetries = 1, options = {}) {
  const { emailType = 'generic', userId = null, recordId = null, bypassSettings = false } = options;
  const config = getSmtpConfig();
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const isTrustedLocal = TRUSTED_LOCAL_ENVS.has(env);

  const to = (mailOptions.to || '').trim().toLowerCase();
  if (!validateRecipientEmail(to)) {
    const errMsg = `Invalid recipient email address: "${mailOptions.to}"`;
    await recordEmailLog({
      recipient: to || 'invalid@recipient',
      emailType,
      subject: mailOptions.subject || '',
      relatedUserId: userId,
      relatedRecordId: recordId,
      status: 'rejected',
      errorCode: 'EENVELOPE',
      errorMessage: errMsg,
      attemptCount: 1,
    });
    return {
      success: false,
      status: 'rejected',
      errorCode: 'EENVELOPE',
      message: errMsg,
    };
  }

  // Prevent duplicate email dispatch within rate window (only mark sent after provider acceptance)
  if (isDuplicateOutboundEmail(to, mailOptions.subject, mailOptions.html, { checkOnly: true })) {
    return {
      success: true,
      status: 'accepted',
      messageId: `dedup_${Date.now()}`,
      providerResponse: '250 Duplicate notification suppressed within rate window',
      deduplicated: true,
    };
  }

  // Anti-Spam & Deliverability Guard: Never dispatch emails to synthetic test fixtures, non-deliverable addresses, or placeholder accounts
  if (!options.bypassSyntheticCheck && (isGuestAccount(to, options.role) || !isLegitimateDeliverableEmail(to, options.role))) {
    const reason = `Email suppressed: recipient "${to}" matches non-deliverable, guest, or synthetic address filter`;
    console.log(`🛡️ [Mailer] ${reason}`);
    await recordEmailLog({
      recipient: to,
      emailType,
      subject: mailOptions.subject || '',
      relatedUserId: userId,
      relatedRecordId: recordId,
      status: 'suppressed',
      errorCode: 'ESYNTHETIC_RECIPIENT',
      errorMessage: reason,
      attemptCount: 0,
    });
    return {
      success: true,
      status: 'suppressed',
      errorCode: 'ESYNTHETIC_RECIPIENT',
      message: reason,
      suppressed: true,
    };
  }

  // Check if transactional notifications are disabled in PlatformSettings
  if (!bypassSettings) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const PlatformSettings = require('../models/PlatformSettings');
        const settings = await PlatformSettings.findOne({ key: 'global_platform_settings' }).lean();
        if (settings && settings.emailNotificationsEnabled === false) {
          await recordEmailLog({
            recipient: to,
            emailType,
            subject: mailOptions.subject || '',
            relatedUserId: userId,
            relatedRecordId: recordId,
            status: 'suppressed',
            errorMessage: 'Email suppressed: Transactional notifications disabled in Admin Settings',
          });
          return {
            success: false,
            status: 'suppressed',
            message: 'Transactional email notifications are currently disabled in Admin Settings.',
          };
        }
      }
    } catch {}
  }

  // 1. If primary SMTP is unconfigured, dispatch via HTTPS transactional provider (Port 443)
  if (!config.isConfigured) {
    const httpProvider = getHttpEmailProvider();
    if (httpProvider) {
      try {
        const res = await sendViaHttpApi(mailOptions, httpProvider);
        if (!res || res.success === false) {
          const errMsg = sanitizeLogMessage(res?.error || res?.message || 'HTTP email provider dispatch failed');
          const errCode = res?.errorCode || 'EPROVIDER';
          console.warn(`⚠️ [Mailer] HTTP provider (${httpProvider.type}) returned unsuccessful response for "${to}": ${errMsg}`);

          await recordEmailLog({
            recipient: to,
            emailType,
            subject: mailOptions.subject || '',
            relatedUserId: userId,
            relatedRecordId: recordId,
            status: 'failed',
            errorCode: errCode,
            errorMessage: errMsg,
            providerResponse: sanitizeLogMessage(res?.providerResponse || errMsg),
            attemptCount: 1,
          });
          return {
            success: false,
            status: 'failed',
            errorCode: errCode,
            message: errMsg,
          };
        } else {
          // Enforce: Never store an undefined or blank message ID as a successful delivery
          const validId = typeof res.messageId === 'string' && res.messageId.trim();
          if (!validId) {
            const errMsg = 'Email provider reported acceptance but returned no valid message ID';
            await recordEmailLog({
              recipient: to,
              emailType,
              subject: mailOptions.subject || '',
              relatedUserId: userId,
              relatedRecordId: recordId,
              status: 'failed',
              errorCode: 'EMISSING_MESSAGE_ID',
              errorMessage: errMsg,
              attemptCount: 1,
            });
            return {
              success: false,
              status: 'failed',
              errorCode: 'EMISSING_MESSAGE_ID',
              message: errMsg,
            };
          }

          await recordEmailLog({
            recipient: to,
            emailType,
            subject: mailOptions.subject || '',
            relatedUserId: userId,
            relatedRecordId: recordId,
            status: 'accepted',
            messageId: validId,
            providerResponse: sanitizeLogMessage(res.providerResponse),
            attemptCount: 1,
          });
          markOutboundEmailSent(to, mailOptions.subject, mailOptions.html);
          return res;
        }
      } catch (apiErr) {
        const safeErrMsg = sanitizeLogMessage(apiErr.message);
        console.warn(`⚠️ [Mailer] HTTP provider (${httpProvider.type}) failed for "${to}": ${safeErrMsg}`);
        const diag = diagnoseSmtpError(apiErr);
        await recordEmailLog({
          recipient: to,
          emailType,
          subject: mailOptions.subject || '',
          relatedUserId: userId,
          relatedRecordId: recordId,
          status: 'failed',
          errorCode: diag.code,
          errorMessage: sanitizeLogMessage(diag.message),
          attemptCount: 1,
        });
        return {
          success: false,
          status: 'failed',
          errorCode: diag.code,
          message: sanitizeLogMessage(diag.message),
        };
      }
    }
  }

  let tp;
  try {
    tp = await getTransporter();
  } catch (initErr) {
    const diag = diagnoseSmtpError(initErr);
    await recordEmailLog({
      recipient: to,
      emailType,
      subject: mailOptions.subject || '',
      relatedUserId: userId,
      relatedRecordId: recordId,
      status: 'failed',
      errorCode: diag.code,
      errorMessage: diag.message,
    });
    return {
      success: false,
      status: 'failed',
      errorCode: diag.code,
      message: diag.message,
    };
  }

  const plainText = mailOptions.text || (mailOptions.html ? mailOptions.html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');

  const finalFrom = mailOptions.from || getSenderAddress() || config.from;
  if (!finalFrom && !isTrustedLocal) {
    const noSenderErr = "Outbound email rejected: No verified sender address configured in production environment.";
    await recordEmailLog({
      recipient: to,
      emailType,
      subject: mailOptions.subject || '',
      relatedUserId: userId,
      relatedRecordId: recordId,
      status: 'failed',
      errorCode: 'ECONFIG',
      errorMessage: noSenderErr,
      attemptCount: 1,
    });
    return {
      success: false,
      status: 'failed',
      errorCode: 'ECONFIG',
      message: noSenderErr,
    };
  }

  const finalOptions = {
    ...mailOptions,
    from: finalFrom,
    text: plainText,
  };

  const isTransient = (code) => {
    return ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', '421', '451'].includes(String(code));
  };

  let attempt = 0;
  let lastErr = null;

  while (attempt <= maxRetries) {
    attempt++;
    let timer = null;

    try {
      const sendPromise = new Promise((resolve, reject) => {
        let settled = false;
        try {
          const ret = tp.sendMail(finalOptions, (err, info) => {
            if (settled) return;
            settled = true;
            if (err) return reject(err);
            resolve(info);
          });
          if (ret && typeof ret.then === 'function') {
            ret.then((info) => {
              if (settled) return;
              settled = true;
              resolve(info);
            }).catch((err) => {
              if (settled) return;
              settled = true;
              reject(err);
            });
          }
        } catch (e) {
          if (!settled) {
            settled = true;
            reject(e);
          }
        }
      });
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          const tErr = new Error('SMTP send timed out after 12000ms');
          tErr.code = 'ETIMEDOUT';
          reject(tErr);
        }, 12000);
      });

      const info = await Promise.race([sendPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      // Check if recipient was rejected by provider
      if (Array.isArray(info.rejected) && info.rejected.length > 0 && (!info.accepted || info.accepted.length === 0)) {
        const rejectMsg = `Recipient ${info.rejected.join(', ')} was rejected by SMTP provider.`;
        await recordEmailLog({
          recipient: to,
          emailType,
          subject: mailOptions.subject || '',
          relatedUserId: userId,
          relatedRecordId: recordId,
          status: 'rejected',
          errorCode: 'EENVELOPE',
          errorMessage: rejectMsg,
          attemptCount: attempt,
        });

        return {
          success: false,
          status: 'rejected',
          errorCode: 'EENVELOPE',
          message: rejectMsg,
        };
      }

      // Enforce: Never store an undefined message ID as a successful delivery
      const validSmtpMsgId = typeof info?.messageId === 'string' && info.messageId.trim();
      if (!validSmtpMsgId) {
        const missingIdMsg = 'SMTP provider completed without returning a message ID';
        await recordEmailLog({
          recipient: to,
          emailType,
          subject: mailOptions.subject || '',
          relatedUserId: userId,
          relatedRecordId: recordId,
          status: 'failed',
          errorCode: 'EMISSING_MESSAGE_ID',
          errorMessage: missingIdMsg,
          attemptCount: attempt,
        });
        return {
          success: false,
          status: 'failed',
          errorCode: 'EMISSING_MESSAGE_ID',
          message: missingIdMsg,
        };
      }

      await recordEmailLog({
        recipient: to,
        emailType,
        subject: mailOptions.subject || '',
        relatedUserId: userId,
        relatedRecordId: recordId,
        status: 'accepted',
        messageId: validSmtpMsgId,
        providerResponse: sanitizeLogMessage(info.response),
        attemptCount: attempt,
      });

      markOutboundEmailSent(to, mailOptions.subject, mailOptions.html);

      return {
        success: true,
        status: 'accepted',
        messageId: validSmtpMsgId,
        accepted: info.accepted,
        rejected: info.rejected,
        providerResponse: info.response,
      };
    } catch (err) {
      if (timer) clearTimeout(timer);
      lastErr = err;

      if (!isTransient(err.code) || attempt > maxRetries) {
        break;
      }

      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt - 1)));
    }
  }

  if (lastErr && (lastErr.code === 'ECONNECTION' || lastErr.code === 'ESOCKET' || lastErr.code === 'EAUTH')) {
    resetTransporter();
  }

  // Transparent fallback to HTTPS email provider if primary SMTP encounters a socket, firewall, or connection failure
  const fallbackHttp = getHttpEmailProvider();
  if (fallbackHttp) {
    try {
      console.log(`ℹ️ [Mailer] Primary SMTP transport hit ${lastErr?.code || 'error'} (${lastErr?.message}); attempting fallback via ${fallbackHttp.type} on Port 443...`);
      const httpRes = await sendViaHttpApi(mailOptions, fallbackHttp);
      if (httpRes && httpRes.success && httpRes.messageId) {
        await recordEmailLog({
          recipient: to,
          emailType,
          subject: mailOptions.subject || '',
          relatedUserId: userId,
          relatedRecordId: recordId,
          status: 'accepted',
          messageId: httpRes.messageId,
          providerResponse: sanitizeLogMessage(httpRes.providerResponse),
          attemptCount: attempt + 1,
        });
        markOutboundEmailSent(to, mailOptions.subject, mailOptions.html);
        return httpRes;
      }
    } catch (fbErr) {
      console.warn(`[Mailer] Fallback via ${fallbackHttp.type} also failed:`, fbErr.message);
    }
  }

  const diag = diagnoseSmtpError(lastErr);
  await recordEmailLog({
    recipient: to,
    emailType,
    subject: mailOptions.subject || '',
    relatedUserId: userId,
    relatedRecordId: recordId,
    status: 'failed',
    errorCode: diag.code,
    errorMessage: diag.message,
    attemptCount: attempt,
  });

  return {
    success: false,
    status: 'failed',
    errorCode: diag.code,
    message: diag.message,
  };
}

/**
 * Dispatches an email action in the background immediately without blocking the caller HTTP thread.
 */
function dispatchMailBackground(mailPromiseFn, meta = {}) {
  setImmediate(async () => {
    try {
      const fn = typeof mailPromiseFn === 'function' ? mailPromiseFn : () => mailPromiseFn;
      const res = await fn();
      if (res && res.success === false) {
        console.warn(`[Mailer Background Warning] ${meta.type || 'email'} to ${meta.recipient || 'recipient'} did not succeed: ${res.message} (${res.errorCode || res.status})`);
      } else if (res && res.success === true) {
        console.log(`✅ [Mailer Background] ${meta.type || 'email'} delivered successfully to ${meta.recipient || 'recipient'} (msgId: ${res.messageId || 'ok'})`);
      }
    } catch (err) {
      console.error(`[Mailer Background Error] Unhandled exception in background email dispatch:`, err.message);
      if (meta.recipient) {
        await recordEmailLog({
          recipient: meta.recipient,
          emailType: meta.type || 'background_job',
          status: 'failed',
          errorCode: 'BACKGROUND_EXCEPTION',
          errorMessage: err.message,
        });
      }
    }
  });
}

// Helper: Check if account is a guest user (unregistered / ephemeral session) or synthetic/test fixture account
function isGuestAccount(email, role) {
  if (role === 'guest') return true;
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  if (lower.startsWith('guest_') || lower.startsWith('guest-') || lower.startsWith('temp_guest_') || lower.startsWith('guest.')) return true;
  if (lower.includes('@guest.') || lower.includes('@masteryzone.local') || lower.endsWith('.local') || lower.endsWith('.test') || lower.endsWith('.invalid')) return true;

  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  const parts = lower.split('@');
  if (parts.length === 2) {
    const [localPart, domain] = parts;
    if (NON_DELIVERABLE_DOMAINS.has(domain)) {
      if (env === 'test' && (domain === 'example.com' || domain === 'example.org' || domain === 'example.net')) {
        // Allow RFC example domains in automated test environment for in-memory mocked assertions
      } else {
        return true;
      }
    }

    // Platform internal domain: MasteryZone has no public mailboxes on @masteryzone.com.
    // Real administrators use their verified email (e.g. yashashyashash1@gmail.com).
    // Any other address ending with @masteryzone.com is a synthetic/test fixture.
    if (domain === 'masteryzone.com') {
      const adminEmail = (process.env.MAIN_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
      if (adminEmail && lower === adminEmail) {
        return false;
      }
      if (env === 'test' && lower === 'admin@masteryzone.com') {
        return false; // Mock test administrator recipient in unit tests
      }
      return true;
    }

    for (const pattern of NON_DELIVERABLE_PATTERNS) {
      if (pattern.test(lower) || pattern.test(localPart)) {
        return true;
      }
    }
  }

  return false;
}

// Helper: Format date & time nicely in Indian Standard Time (IST)
function formatEmailDateTime(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  };
  return d.toLocaleString('en-IN', options);
}

// Helper: Format time nicely in Indian Standard Time (IST)
function formatEmailTime(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' IST';
}

// Helper: Parse client request telemetry safely
function parseDeviceAndBrowser(req) {
  if (req && req.browser && req.os && req.clientIp && req.deviceSummary) {
    return req;
  }
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

// ── 4. CLIENT URL RESOLVER & BRANDED MOBILE-FIRST TEMPLATES ──

/**
 * Resolves the absolute base URL for links in emails.
 * Mobile devices can never open 'http://localhost:...'.
 * This prioritizes:
 * 1. process.env.CLIENT_URL (e.g. production domain when deployed)
 * 2. Incoming request's non-localhost origin/referer
 * 3. Local machine's real IPv4 LAN address (e.g. http://172.22.128.136:5174) for local Wi-Fi mobile testing
 * 4. Fallback to http://localhost:5174
 */
function getClientBaseUrl(req = null, overrideOrigin = null) {
  if (req && req.clientUrl && typeof req.clientUrl === 'string') {
    return req.clientUrl.trim().replace(/\/+$/, '');
  }

  if (overrideOrigin && typeof overrideOrigin === 'string' && overrideOrigin.trim()) {
    const clean = overrideOrigin.trim().replace(/\/+$/, '');
    if (!clean.includes('localhost') && !clean.includes('127.0.0.1')) {
      return clean;
    }
  }

  // Prioritize explicit FRONTEND_URL or CLIENT_URL pointing to the user-facing web app
  const configuredFrontend = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  if (configuredFrontend && typeof configuredFrontend === 'string' && configuredFrontend.trim()) {
    const envUrl = configuredFrontend.trim().replace(/\/+$/, '');
    if (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
  }

  if (req) {
    const reqOrigin =
      req.body?.clientOrigin ||
      (typeof req.get === 'function' ? req.get('origin') : null) ||
      req.headers?.origin ||
      req.headers?.referer ||
      '';
    if (reqOrigin && typeof reqOrigin === 'string') {
      try {
        const u = new URL(reqOrigin);
        if (u.hostname && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
          return `${u.protocol}//${u.host}`.replace(/\/+$/, '');
        }
      } catch {}
    }
  }

  if (process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production') {
    return (process.env.RENDER_EXTERNAL_URL || 'https://mastery-zone.onrender.com').trim().replace(/\/+$/, '');
  }

  const lanIp = getLanIpAddress();
  if (lanIp && lanIp !== '127.0.0.1') {
    return `http://${lanIp}:5174`;
  }

  return 'http://localhost:5174';
}

/**
 * Renders an interactive, touch-friendly bulletproof email button.
 * Conforms to Apple and Android tap targets (min 48px height) and expands cleanly on mobile screens.
 */
function renderBulletproofButton({
  url,
  label,
  secondaryUrl = null,
  secondaryLabel = null,
  gradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  bgColor = '#4f46e5',
  showDirectLink = true,
}) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 26px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="mobile-btn-container" style="margin: 0 auto; max-width: 100%;">
            <tr>
              <td align="center" style="border-radius: 12px; background: ${bgColor}; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                <a href="${url}" target="_blank" class="mobile-action-btn" style="display: inline-block; min-height: 48px; line-height: 48px; padding: 0 32px; background: ${gradient}; color: #ffffff !important; text-decoration: none !important; font-size: 15px; font-weight: 800; border-radius: 12px; text-align: center; letter-spacing: 0.3px; -webkit-text-size-adjust: none;">
                  ${label} →
                </a>
              </td>
            </tr>
          </table>
          ${
            secondaryUrl && secondaryLabel
              ? `
            <div style="margin-top: 14px;">
              <a href="${secondaryUrl}" target="_blank" style="color: #4f46e5; font-size: 13.5px; font-weight: 700; text-decoration: underline; display: inline-block; padding: 6px 12px;">
                ${secondaryLabel}
              </a>
            </div>
          `
              : ''
          }
          ${
            showDirectLink
              ? `
            <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; max-width: 520px; margin-left: auto; margin-right: auto; text-align: left;">
              <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px; font-weight: 700; text-transform: uppercase;">Direct Link (Mobile & Desktop):</span>
              <a href="${url}" target="_blank" style="font-size: 12.5px; color: #4338ca; font-weight: 700; word-break: break-all; text-decoration: underline; font-family: monospace;">
                ${url}
              </a>
            </div>
          `
              : ''
          }
        </td>
      </tr>
    </table>
  `;
}

// Standard Mastery Zone Base Layout Wrapper (Fully Responsive Mobile-First Architecture)
function wrapHtmlEmail({ title, preheader, badgeText, badgeColor = '#4f46e5', badgeBg = '#eef2ff', contentHtml }) {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${title}</title>
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    img {
      border: 0 !important;
      outline: none !important;
      text-decoration: none !important;
      -ms-interpolation-mode: bicubic !important;
    }
    a {
      text-decoration: none;
    }
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 18px 0;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .data-table td {
      padding: 11px 15px;
      font-size: 13.5px;
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
    .alert-box {
      border-radius: 12px;
      padding: 16px 18px;
      margin: 20px 0;
      font-size: 13.5px;
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

    /* Mobile media query overrides */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .mobile-padding {
        padding: 24px 16px !important;
      }
      .mobile-header-padding {
        padding: 28px 18px !important;
      }
      .mobile-action-btn {
        display: block !important;
        width: 100% !important;
        min-height: 52px !important;
        line-height: 52px !important;
        padding: 0 16px !important;
        box-sizing: border-box !important;
        font-size: 16px !important;
      }
      .mobile-btn-container {
        width: 100% !important;
      }
      .data-table td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 9px 12px !important;
      }
      .data-table td.label {
        background: #f1f5f9 !important;
        font-weight: 700 !important;
        border-bottom: none !important;
      }
      .mobile-title {
        font-size: 20px !important;
      }
      .otp-digit-box {
        font-size: 28px !important;
        letter-spacing: 5px !important;
        padding: 14px 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; width: 100% !important; -webkit-text-size-adjust: 100%;">
  <div style="display:none;font-size:1px;color:#0f172a;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader || title}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; margin: 0; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 0 8px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35); border: 1px solid #1e293b;">
          
          <!-- Header Banner -->
          <tr>
            <td class="mobile-header-padding" align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 34px 28px 28px; text-align: center; border-bottom: 2px solid #4338ca;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
                      <span style="color: #67e8f9; font-weight: 900; font-size: 16px; letter-spacing: 1px;">⚡ MASTERY ZONE</span>
                    </div>
                    <div style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 4px;">
                      Engineering & Accreditation
                    </div>
                    <div style="color: #c7d2fe; font-size: 12.5px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">
                      Proctored Assessment & Career Excellence
                    </div>
                    ${
                      badgeText
                        ? `
                      <div style="margin-top: 14px;">
                        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; color: ${badgeColor}; background-color: ${badgeBg}; letter-spacing: 0.3px; border: 1px solid rgba(0,0,0,0.06);">
                          ${badgeText}
                        </span>
                      </div>
                    `
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Email Body -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 30px; background-color: #ffffff; color: #0f172a; font-size: 14.5px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-padding" style="background-color: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #475569; font-weight: 700;">
                Mastery Zone Academic & Accreditation Platform
              </p>
              <p style="margin: 0 0 10px; font-size: 11.5px; color: #64748b; line-height: 1.5;">
                Automated identity telemetry, proctored audit tracking, and verified career credentials.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This message was dispatched securely to your registered email. To update preferences, visit Candidate Settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
    if (!user || !user.email) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest login (${user.email}) — skipped external email delivery.`);
      return { success: true, status: 'skipped_guest' };
    }

    const { browser, os, clientIp, deviceSummary } = parseDeviceAndBrowser(req);
    const candidateName = user.fullName || user.username || 'Candidate';
    const loginTimeStr = formatEmailDateTime(new Date());

    const clientUrl = getClientBaseUrl(req);
    const resetUrl = `${clientUrl}/forgot-password`;
    const dashboardUrl = `${clientUrl}/home`;

    const badgeText = isNewDevice ? '⚠️ New Device Sign-In' : '🛡️ Successful Login';
    const badgeColor = isNewDevice ? '#b45309' : '#15803d';
    const badgeBg = isNewDevice ? '#fef3c7' : '#dcfce7';

    const buttonHtml = renderBulletproofButton({
      url: resetUrl,
      label: isNewDevice ? 'Not You? Secure Your Account' : 'Manage Account Security',
      secondaryUrl: dashboardUrl,
      secondaryLabel: 'Go to Candidate Dashboard',
      gradient: isNewDevice
        ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: isNewDevice ? '#d97706' : '#4f46e5',
      showDirectLink: isNewDevice,
    });

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

      ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Security'),
      to: user.email,
      subject: isNewDevice
        ? `[Security Alert] New device sign-in to Mastery Zone`
        : `New sign-in to your Mastery Zone account`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: 'login_notification', userId: user?._id });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error('Error in sendLoginNotification:', err.message);
    return { success: false, status: 'failed', errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send password reset request email with expiring secure link
 */
async function sendPasswordResetEmail(user, resetToken, req, clientOriginOverride = null) {
  try {
    if (!user || !user.email) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest password reset (${user.email}) — skipped external email delivery.`);
      return { success: true, status: 'skipped_guest' };
    }

    const candidateName = user.fullName || user.username || 'Candidate';
    const clientUrl = getClientBaseUrl(req, clientOriginOverride);
    const universalResetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const buttonHtml = renderBulletproofButton({
      url: universalResetUrl,
      label: 'Reset Your Password',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: '#4f46e5',
      showDirectLink: true,
    });

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

      ${buttonHtml}

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
      from: getSenderAddress('Mastery Zone Security'),
      to: user.email,
      subject: 'Reset your Mastery Zone password',
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: 'password_reset', userId: user?._id, bypassSettings: true });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error('Error in sendPasswordResetEmail:', err.message);
    return { success: false, status: 'failed', errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send real-time signup welcome email notification
 */
async function sendSignupNotification(user, req) {
  try {
    if (!user || !user.email) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest signup (${user.email}) — skipped external email delivery.`);
      return { success: true, status: 'skipped_guest' };
    }

    const { browser, os, clientIp, deviceSummary } = parseDeviceAndBrowser(req);
    const candidateName = user.fullName || user.username || 'Candidate';
    const createdAtStr = formatEmailDateTime(user.createdAt || new Date());

    const clientUrl = getClientBaseUrl(req);
    const loginUrl = `${clientUrl}/login`;
    const exploreUrl = `${clientUrl}/home`;

    const badgeText = '🎉 Welcome to Mastery Zone';
    const badgeColor = '#059669';
    const badgeBg = '#d1fae5';

    const buttonHtml = renderBulletproofButton({
      url: loginUrl,
      label: 'Log In & Start Learning',
      secondaryUrl: exploreUrl,
      secondaryLabel: 'Explore Platform Catalog',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      bgColor: '#059669',
      showDirectLink: true,
    });

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

      ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Security'),
      to: user.email,
      subject: 'Welcome to Mastery Zone — Account Created Successfully',
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: 'signup_welcome', userId: user?._id });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error('Error in sendSignupNotification:', err.message);
    return { success: false, status: 'failed', errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send password reset confirmation email after successful reset
 */
async function sendPasswordResetSuccessEmail(user, req) {
  try {
    if (!user || !user.email) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(user.email, user.role)) {
      console.log(`ℹ️ [Mailer] Guest password reset confirmation (${user.email}) — skipped.`);
      return { success: true, status: 'skipped_guest' };
    }

    const { browser, os, clientIp } = parseDeviceAndBrowser(req);
    const candidateName = user.fullName || user.username || 'Candidate';
    const changeTimeStr = formatEmailDateTime(new Date());

    const clientUrl = getClientBaseUrl(req);
    const loginUrl = `${clientUrl}/login`;
    const forgotUrl = `${clientUrl}/forgot-password`;

    const buttonHtml = renderBulletproofButton({
      url: loginUrl,
      label: 'Sign In with New Password',
      secondaryUrl: `${clientUrl}/settings`,
      secondaryLabel: 'Review Security Settings',
      gradient: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
      bgColor: '#15803d',
      showDirectLink: true,
    });

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

      ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Security'),
      to: user.email,
      subject: 'Your Mastery Zone password was successfully changed',
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: 'password_reset_success', userId: user?._id, bypassSettings: true });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error('Error in sendPasswordResetSuccessEmail:', err.message);
    return { success: false, status: 'failed', errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send OTP verification email
 */
async function sendOtpEmail(userEmail, otp, req = null) {
  try {
    if (!userEmail) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(userEmail)) return { success: true, status: 'skipped_guest' };

    const clientUrl = getClientBaseUrl(req);
    const loginUrl = `${clientUrl}/login`;

    const buttonHtml = renderBulletproofButton({
      url: loginUrl,
      label: 'Enter Code in Sign-In',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: '#4f46e5',
      showDirectLink: false,
    });

    const contentHtml = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px;">
        Your Mastery Zone One-Time Code
      </h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 18px;">
        Use the verification code below to sign in or confirm your identity. This code is valid for <strong>10 minutes</strong>.
      </p>

      <div style="text-align: center; padding: 22px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">
          ${otp}
        </span>
      </div>

      ${buttonHtml}

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0 0; text-align: center;">
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
      from: getSenderAddress('Mastery Zone Security'),
      to: userEmail,
      subject: `Your Mastery Zone Verification Code: ${otp}`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: 'user_otp', bypassSettings: true });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error('Error in sendOtpEmail:', err.message);
    return { success: false, status: 'failed', errorCode: diag.code, message: diag.message };
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
  score = 0,
  maxScore = 100,
  percentage = null,
  verdict = "EVALUATED",
  adminComment = "",
  reviewedAt = new Date(),
  reportUrl = "",
  req = null,
}) {
  try {
    if (!userEmail) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No user email provided' };
    if (isGuestAccount(userEmail)) return { success: true, status: 'skipped_guest' };

    const resolvedTitle = assessmentTitle || challengeTitle;
    const isPassed = verdict === "ACCEPTED" || verdict === "PASSED" || verdict === "Passed";
    const badgeColor = isPassed ? "#059669" : "#d97706";
    const badgeBg = isPassed ? "#ecfdf5" : "#fffbeb";
    const statusText = isPassed ? "PASSED" : verdict;
    const typeLabel = assessmentType === "certification" 
      ? "Professional Certification Exam" 
      : assessmentType === "module" 
      ? "Curriculum Module Assessment" 
      : assessmentType === "project"
      ? "Full-Stack Project Evaluation"
      : assessmentType === "proctoring"
      ? "Proctored Examination"
      : "Coding Challenge Submission";

    const displayScore = percentage != null 
      ? `${score}/${maxScore} (${percentage}%)` 
      : `${score}/${maxScore}`;

    const clientUrl = getClientBaseUrl(req);
    let resolvedLink = `${clientUrl}/home`;
    if (reportUrl) {
      resolvedLink = reportUrl.startsWith('http')
        ? reportUrl
        : `${clientUrl}${reportUrl.startsWith('/') ? '' : '/'}${reportUrl}`;
    }

    const buttonHtml = renderBulletproofButton({
      url: resolvedLink,
      label: 'View Verified Assessment Report',
      secondaryUrl: `${clientUrl}/home`,
      secondaryLabel: 'Return to Platform Home',
      gradient: isPassed
        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
        : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      bgColor: isPassed ? '#059669' : '#d97706',
      showDirectLink: true,
    });

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

        ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Academics'),
      to: userEmail,
      subject: `[MasteryZone] Score Updated: ${resolvedTitle} (${displayScore} - ${statusText})`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: 'submission_evaluated' });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendSubmissionEvaluationEmail error:", err.message);
    return { success: false, status: 'failed', errorCode: diag.code, message: diag.message };
  }
}

/**
 * Dispatches 6-digit verification OTP to Main Admin for Admin Management access
 */
async function sendMainAdminOtpEmail({ toEmail, otp, expiresMinutes = 10, req = null }) {
  try {
    const clientUrl = getClientBaseUrl(req);
    const adminUrl = `${clientUrl}/admin`;

    const buttonHtml = renderBulletproofButton({
      url: adminUrl,
      label: 'Open Admin Verification Portal',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      bgColor: '#7c3aed',
      showDirectLink: false,
    });

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

        ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Security'),
      to: toEmail,
      subject: `[MasteryZone Security] ${otp} is your Admin Management Verification Code`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: "admin_otp", bypassSettings: true });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendMainAdminOtpEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

/**
 * Dispatches welcome email with initial temporary credentials to newly created Administrator
 */
async function sendNewAdminWelcomeEmail({ adminEmail, adminName, tempPassword, permissions = [], loginUrl = null, req = null }) {
  try {
    const clientUrl = getClientBaseUrl(req);
    const resolvedLoginUrl = loginUrl || `${clientUrl}/login`;

    const permsList = permissions.includes("*")
      ? "Full Administrative Access"
      : permissions.join(", ");

    const buttonHtml = renderBulletproofButton({
      url: resolvedLoginUrl,
      label: 'Access MasteryZone Admin Portal',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: '#4f46e5',
      showDirectLink: true,
    });

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

        ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Security'),
      to: adminEmail,
      subject: `[MasteryZone] Administrator Account Credentials Created (${adminEmail})`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: "admin_welcome", bypassSettings: true });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendNewAdminWelcomeEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

/**
 * Dispatches confirmation notification when an administrator's credentials are reset/updated
 */
async function sendAdminPasswordChangedEmail({ adminEmail, adminName, changedBy = "Main Administrator", req = null }) {
  try {
    const clientUrl = getClientBaseUrl(req);
    const adminUrl = `${clientUrl}/admin`;

    const buttonHtml = renderBulletproofButton({
      url: adminUrl,
      label: 'Sign In to Admin Portal',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      bgColor: '#059669',
      showDirectLink: true,
    });

    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Administrator Password Updated
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${adminName}</strong>,<br/>
          Your password for the <strong>MasteryZone Administrator Account</strong> was recently modified by <strong>${changedBy}</strong> on ${formatEmailDateTime(new Date())}.
        </p>

        <div style="padding: 12px 16px; background: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; color: #065f46; font-size: 13px; margin-bottom: 20px;">
          ✅ <strong>Security Status:</strong> If you requested this update, no further action is necessary. You may now sign in using your updated credentials.
        </div>

        ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Security'),
      to: adminEmail,
      subject: `[Security Notice] Administrator Password Modified (${adminEmail})`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: "admin_password_changed", bypassSettings: true });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendAdminPasswordChangedEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
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
  ticketUrl = null,
  req = null,
}) {
  try {
    if (!userEmail) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(userEmail)) return { success: true, status: 'skipped_guest' };
    const clientUrl = getClientBaseUrl(req);
    const resolvedTicketUrl = ticketUrl || `${clientUrl}/help?ticket=${ticketId}`;

    const buttonHtml = renderBulletproofButton({
      url: resolvedTicketUrl,
      label: 'View Ticket & Live Status',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: '#4f46e5',
      showDirectLink: true,
    });

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

        ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Support'),
      to: userEmail,
      subject: `[Ticket ${ticketId}] Issue Logged: ${subject}`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: "ticket_submitted", recordId: ticketId });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendSupportTicketSubmittedEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
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
  ticketUrl = null,
  req = null,
}) {
  try {
    if (!userEmail) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No recipient email provided' };
    if (isGuestAccount(userEmail)) return { success: true, status: 'skipped_guest' };
    const isResolved = status === "Resolved";
    const statusColor = isResolved ? "#059669" : "#2563eb";
    const statusBg = isResolved ? "#ecfdf5" : "#eff6ff";

    const clientUrl = getClientBaseUrl(req);
    const resolvedTicketUrl = ticketUrl || `${clientUrl}/help?ticket=${ticketId}`;

    const buttonHtml = renderBulletproofButton({
      url: resolvedTicketUrl,
      label: isResolved ? 'Review Resolved Ticket' : 'Open Ticket & Reply',
      gradient: isResolved
        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: isResolved ? '#059669' : '#4f46e5',
      showDirectLink: true,
    });

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

        ${buttonHtml}
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
      from: getSenderAddress('Mastery Zone Support'),
      to: userEmail,
      subject: `[Update: ${ticketId}] ${isResolved ? "Issue Resolved" : "New Admin Response"}: ${subject}`,
      html,
    };

    return await sendMailWithRetry(mailOptions, 1, { emailType: "ticket_response", recordId: ticketId });
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendSupportTicketResponseEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send official Certificate Awarded notification email
 */
async function sendCertificateAwardedEmail({
  candidateEmail,
  candidateName = "Candidate",
  certTitle = "Official Certification",
  certificateId,
  score = 100,
  verificationUrl = "",
  issuedAt = new Date(),
  pdfPath = null,
  req = null,
}) {
  try {
    if (!candidateEmail) return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No candidate email provided' };
    if (isGuestAccount(candidateEmail)) return { success: true, status: 'skipped_guest' };

    const clientUrl = getClientBaseUrl(req);
    const resolvedVerifyUrl = verificationUrl || `${clientUrl}/verify/${certificateId}`;
    const certificatesUrl = `${clientUrl}/certificates`;

    const buttonHtml = renderBulletproofButton({
      url: resolvedVerifyUrl,
      label: 'View & Verify Official Credential',
      secondaryUrl: certificatesUrl,
      secondaryLabel: 'View All My Certificates',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      bgColor: '#059669',
      showDirectLink: true,
    });

    const contentHtml = `
      <div style="padding: 18px 0 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #ecfdf5; border: 2px solid #10b981; border-radius: 50%; width: 68px; height: 68px; line-height: 68px; font-size: 32px; text-align: center; margin-bottom: 12px;">
            🎓
          </div>
          <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #0f172a;">
            Certification Successfully Awarded!
          </h2>
          <p style="margin: 0; font-size: 14px; color: #059669; font-weight: 600;">
            Verified Professional Credential Issued
          </p>
        </div>

        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #334155;">
          Dear <strong>${candidateName}</strong>,<br/>
          Congratulations! You have satisfied all proctoring criteria, passed the comprehensive examination with an overall score of <strong>${score}%</strong>, and officially earned your <strong>${certTitle}</strong> credential.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Certificate Title:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">${certTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Credential ID:</td>
              <td style="padding: 6px 0; color: #4338ca; font-weight: 800; font-family: monospace; font-size: 14px; text-align: right;">${certificateId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Overall Score:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: 800; font-size: 15px; text-align: right;">${score}% (PASSED)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Issue Date:</td>
              <td style="padding: 6px 0; color: #64748b; text-align: right;">${formatEmailDateTime(issuedAt)}</td>
            </tr>
          </table>
        </div>

        ${buttonHtml}
      </div>
    `;

    const html = wrapHtmlEmail({
      title: `Official Credential Awarded: ${certTitle}`,
      preheader: `Congratulations ${candidateName}! Your official ${certTitle} certificate #${certificateId} is now live and verified.`,
      badgeText: "🏆 Certified Professional",
      badgeColor: "#059669",
      badgeBg: "#ecfdf5",
      contentHtml,
    });

    const attachments = [];
    let targetPdf = pdfPath;
    if (!targetPdf && certificateId) {
      const flatPath = path.join(__dirname, "../uploads/certificates", `${certificateId}.pdf`);
      if (fs.existsSync(flatPath)) {
        targetPdf = flatPath;
      }
    }

    function isReadablePdf(p) {
      if (!p || !fs.existsSync(p)) return false;
      try {
        const stat = fs.statSync(p);
        if (stat.size < 500) return false;
        const fd = fs.openSync(p, "r");
        const buf = Buffer.alloc(5);
        fs.readSync(fd, buf, 0, 5, 0);
        fs.closeSync(fd);
        return buf.toString("utf8") === "%PDF-";
      } catch {
        return false;
      }
    }

    if (targetPdf && isReadablePdf(targetPdf)) {
      attachments.push({
        filename: `MasteryZone_${certTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${certificateId}.pdf`,
        path: targetPdf,
        contentType: 'application/pdf',
      });
    }

    return await sendMailWithRetry(
      {
        from: getSenderAddress('Mastery Zone Certifications'),
        to: candidateEmail,
        subject: `🏆 Certificate Awarded: ${certTitle} [ID: ${certificateId}]`,
        html,
        attachments,
      },
      1,
      { emailType: "certificate_awarded", recordId: certificateId }
    );
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendCertificateAwardedEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send official Module Completion notification email
 * Triggered when a student completes the MCQ assessment and scores 8 marks or above.
 */
async function sendModuleCompletionEmail({
  userEmail,
  userName = "Student",
  moduleNumber = 1,
  moduleName = "",
  codingMarks = null,
  codingMaxMarks = 100,
  mcqMarks = 8,
  mcqMaxMarks = 10,
  combinedMarks = null,
  mcqCutoff = "8/10",
  completionStatus = "COMPLETED",
  completionDate = new Date(),
  reportUrl = "",
  req = null,
}) {
  try {
    if (!userEmail) {
      return { success: false, status: 'rejected', errorCode: 'EENVELOPE', message: 'No student email provided' };
    }
    if (isGuestAccount(userEmail)) {
      return { success: true, status: 'skipped_guest' };
    }

    const clientUrl = getClientBaseUrl(req);
    let resolvedLink = `${clientUrl}/home`;
    if (reportUrl) {
      resolvedLink = reportUrl.startsWith('http')
        ? reportUrl
        : `${clientUrl}${reportUrl.startsWith('/') ? '' : '/'}${reportUrl}`;
    }

    const buttonHtml = renderBulletproofButton({
      url: resolvedLink,
      label: 'View Verified Assessment Report',
      secondaryUrl: `${clientUrl}/home`,
      secondaryLabel: 'Return to Platform Home',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      bgColor: '#059669',
      showDirectLink: true,
    });

    const displayCodingMarks = codingMarks !== null && codingMarks !== undefined && codingMarks !== ""
      ? (String(codingMarks).includes("/") ? String(codingMarks) : `${codingMarks} / ${codingMaxMarks}`)
      : "Not Attempted (0 / 100)";

    const contentHtml = `
      <div style="padding: 18px 0 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #ecfdf5; border: 2px solid #10b981; border-radius: 50%; width: 68px; height: 68px; line-height: 68px; font-size: 32px; text-align: center; margin-bottom: 12px;">
            🎉
          </div>
          <h2 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #0f172a;">
            Module ${moduleNumber} Completed!
          </h2>
          <p style="margin: 0; font-size: 14px; color: #059669; font-weight: 600;">
            ${moduleName ? `${moduleName} — Accreditation Requirements Satisfied` : "Accreditation Requirements Satisfied"}
          </p>
        </div>

        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #334155;">
          Hello <strong>${userName}</strong>,<br/>
          Congratulations! You have successfully completed <strong>Module ${moduleNumber}${moduleName ? `: ${moduleName}` : ""}</strong> by satisfying the curriculum requirements and achieving <strong>${mcqMarks}/${mcqMaxMarks}</strong> marks on the proctored MCQ assessment (passing cutoff: <strong>${mcqCutoff}</strong>).
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Student Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Module Number & Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">Module ${moduleNumber}${moduleName ? ` — ${moduleName}` : ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Coding Assessment Marks:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${displayCodingMarks}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">MCQ Assessment Marks:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: 800; font-size: 14px; text-align: right;">${mcqMarks} / ${mcqMaxMarks}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">MCQ Cutoff Threshold:</td>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; text-align: right;">${mcqCutoff} (Achieved: ${mcqMarks}/${mcqMaxMarks})</td>
            </tr>
            ${combinedMarks ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Combined Module Marks:</td>
              <td style="padding: 8px 0; color: #2563eb; font-weight: 800; text-align: right;">${combinedMarks}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Module Completion Status:</td>
              <td style="padding: 8px 0; text-align: right;">
                <span style="display: inline-block; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 800;">
                  ${completionStatus}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Completion Date:</td>
              <td style="padding: 8px 0; color: #64748b; text-align: right;">${formatEmailDateTime(completionDate)}</td>
            </tr>
          </table>
        </div>

        ${buttonHtml}
      </div>
    `;

    const html = wrapHtmlEmail({
      title: `Mastery Zone – Module ${moduleNumber} Completion Update`,
      preheader: `Congratulations ${userName}! You have completed Module ${moduleNumber}: ${moduleName} with ${mcqMarks}/${mcqMaxMarks} on your MCQ assessment.`,
      badgeText: "🏆 Module Accreditation Cleared",
      badgeColor: "#059669",
      badgeBg: "#ecfdf5",
      contentHtml,
    });

    return await sendMailWithRetry(
      {
        from: getSenderAddress('Mastery Zone Academics'),
        to: userEmail,
        subject: `Mastery Zone – Module ${moduleNumber} Completion Update`,
        html,
      },
      1,
      { emailType: "module_completion_update", recordId: `mod_${moduleNumber}` }
    );
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendModuleCompletionEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send official test email to verify SMTP delivery and configuration
 */
async function sendTestEmail({ toEmail, requestedBy = "Administrator", req = null }) {
  try {
    if (!toEmail) {
      return { success: false, status: "rejected", errorCode: "EENVELOPE", message: "No recipient email provided" };
    }

    const clientUrl = getClientBaseUrl(req);
    const testTimeStr = formatEmailDateTime(new Date());
    const config = getSmtpConfig();

    const buttonHtml = renderBulletproofButton({
      url: `${clientUrl}/admin`,
      label: 'Open Mastery Zone Admin Portal',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      bgColor: '#4f46e5',
      showDirectLink: false,
    });

    const contentHtml = `
      <div style="padding: 16px 0;">
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Mastery Zone SMTP Test Email
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          This is an official test message dispatched by <strong>${requestedBy}</strong> to verify the live SMTP email configuration.
        </p>

        <div style="padding: 14px 18px; background: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0; color: #065f46; font-size: 13px; margin-bottom: 20px;">
          ✅ <strong>SMTP Verification Successful:</strong> The mail transport is active, authenticated, and communicating properly with your email provider.
        </div>

        <table class="data-table">
          <tr>
            <td class="label">Dispatched At</td>
            <td class="val">${testTimeStr}</td>
          </tr>
          <tr>
            <td class="label">Recipient</td>
            <td class="val">${toEmail}</td>
          </tr>
          <tr>
            <td class="label">Sender Identity</td>
            <td class="val">${config.from}</td>
          </tr>
          <tr>
            <td class="label">Mail Server Host</td>
            <td class="val">${config.host}:${config.port} (${config.secure ? "SSL/TLS" : "STARTTLS"})</td>
          </tr>
        </table>

        ${buttonHtml}
      </div>
    `;

    const html = wrapHtmlEmail({
      title: "Mastery Zone SMTP Test Message",
      preheader: `SMTP test email successfully dispatched at ${testTimeStr}`,
      badgeText: "🧪 SMTP System Test",
      badgeColor: "#059669",
      badgeBg: "#ecfdf5",
      contentHtml,
    });

    return await sendMailWithRetry(
      {
        from: getSenderAddress('Mastery Zone Systems'),
        to: toEmail,
        subject: `[Mastery Zone] SMTP Configuration Test (${formatEmailTime(new Date())})`,
        html,
      },
      1,
      { emailType: "admin_test_email", bypassSettings: true }
    );
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

/**
 * Send live meeting collaboration invitation email
 */
async function sendMeetingInvitationEmail({
  toEmail,
  meetingId,
  meetingTitle = "Live Collaboration Session",
  hostName = "The Host",
  hostEmail = "",
  joinUrl = null,
  customNote = "",
  req = null,
}) {
  try {
    if (!toEmail) {
      return { success: false, status: "rejected", errorCode: "EENVELOPE", message: "No recipient email provided" };
    }
    const cleanTo = String(toEmail).trim().toLowerCase();
    if (!validateRecipientEmail(cleanTo)) {
      return { success: false, status: "rejected", errorCode: "EENVELOPE", message: `Invalid recipient email address: "${toEmail}"` };
    }
    if (isGuestAccount(cleanTo)) {
      console.log(`ℹ️ [Mailer] Guest meeting invite (${cleanTo}) — skipped external delivery.`);
      return { success: true, status: "skipped_guest" };
    }

    const clientUrl = getClientBaseUrl(req);
    const finalJoinUrl = joinUrl || `${clientUrl}/meeting/${meetingId}`;
    const sentTimeStr = formatEmailDateTime(new Date());

    const buttonHtml = renderBulletproofButton({
      url: finalJoinUrl,
      label: "Join Live Meeting Now",
      gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      bgColor: "#2563eb",
      showDirectLink: true,
    });

    const contentHtml = `
      <div style="padding: 16px 0;">
        <div style="display: inline-block; padding: 4px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          ⚡ Mastery Zone Live Collaboration
        </div>
        <h2 style="margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #0f172a;">
          You're Invited to Join a Live Session
        </h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
          <strong>${hostName}</strong>${hostEmail ? ` (${hostEmail})` : ""} has invited you to collaborate in real time on <strong>Mastery Zone Live</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 120px;">Session Topic:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${meetingTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Meeting ID:</td>
              <td style="padding: 6px 0; color: #2563eb; font-family: monospace; font-weight: 700;">${meetingId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Dispatched At:</td>
              <td style="padding: 6px 0; color: #334155;">${sentTimeStr}</td>
            </tr>
            ${customNote ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: 600; vertical-align: top;">Note from Host:</td><td style="padding: 6px 0; color: #334155;">${customNote}</td></tr>` : ""}
          </table>
        </div>

        <p style="margin: 0 0 16px; font-size: 13.5px; line-height: 1.5; color: #475569;">
          Click the button below to open your camera/mic preview and enter the collaboration room:
        </p>

        ${buttonHtml}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          💡 <em>Tip: You can join directly from any modern web browser without installing additional software. Ensure camera and microphone permissions are allowed when prompted.</em>
        </div>
      </div>
    `;

    const html = wrapHtmlEmail(contentHtml, {
      title: `Meeting Invitation: ${meetingTitle}`,
      preheader: `${hostName} invited you to join "${meetingTitle}" on Mastery Zone Live`,
    });

    return await sendMailWithRetry(
      {
        from: getSenderAddress(hostName ? `${hostName} via Mastery Zone` : "Mastery Zone Live"),
        to: cleanTo,
        subject: `[Live Invitation] ${hostName} invited you to "${meetingTitle}" (${meetingId})`,
        html,
      },
      2,
      { emailType: "meeting_invitation", recordId: `meeting_${meetingId}` }
    );
  } catch (err) {
    const diag = diagnoseSmtpError(err);
    console.error("sendMeetingInvitationEmail error:", err.message);
    return { success: false, status: "failed", errorCode: diag.code, message: diag.message };
  }
}

module.exports = {
  getTransporter,
  resetTransporter,
  getSmtpConfig,
  verifySmtpConnection,
  diagnoseSmtpError,
  maskEmail,
  sendMail: sendMailWithRetry,
  sendMailWithRetry,
  parseDeviceAndBrowser,
  getClientBaseUrl,
  renderBulletproofButton,
  wrapHtmlEmail,
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
  sendCertificateAwardedEmail,
  sendModuleCompletionEmail,
  sendTestEmail,
  sendMeetingInvitationEmail,
  dispatchMailBackground,
  isGuestAccount,
  isLegitimateDeliverableEmail,
  getSenderAddress,
  formatEmailDateTime,
  formatEmailTime,
  isDuplicateOutboundEmail,
  markOutboundEmailSent,
  clearSentNotificationCache,
  validateRecipientEmail,
  getHttpEmailProvider,
  sendViaHttpApi,
  sanitizeLogMessage,
};
