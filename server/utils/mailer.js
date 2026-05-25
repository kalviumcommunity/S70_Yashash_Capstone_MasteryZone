const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

// Automatically create a test Ethereal account so the user doesn't have to provide real credentials
nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to create a testing account. ' + err.message);
    return;
  }

  // Create a transporter object using the default SMTP transport
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log("📧 Ethereal Test Mailer Initialized Successfully!");
});

const sendLoginNotification = async (userEmail, username) => {
  if (!transporter) {
    console.log(`[Mock Mailer] Sent login notification to ${userEmail} for user ${username}`);
    return;
  }

  const mailOptions = {
    from: `"MasteryZone Security" <security@masteryzone.com>`,
    to: userEmail,
    subject: 'New Login Detected on MasteryZone',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6a0572;">Hello ${username},</h2>
        <p>We detected a new login to your MasteryZone account (${userEmail}).</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>If this was you, you can safely ignore this email.</p>
        <p>If you did not log in, please reset your password immediately or contact support.</p>
        <br />
        <p>Stay sharp,</p>
        <p><strong>The MasteryZone Team</strong></p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\n==========================================`);
    console.log(`✅ Email notification successfully sent to: ${userEmail}`);
    console.log(`🔗 VIEW THE SENT EMAIL HERE: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`==========================================\n`);
  } catch (error) {
    console.error('Error sending login notification email:', error);
  }
};

const sendPasswordResetEmail = async (userEmail, resetLink) => {
  if (!transporter) {
    console.log(`[Mock Mailer] Sent password reset link to ${userEmail}: ${resetLink}`);
    return;
  }

  const mailOptions = {
    from: `"MasteryZone Security" <security@masteryzone.com>`,
    to: userEmail,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6a0572;">Password Reset</h2>
        <p>We received a request to reset your password. Click the button below to choose a new password.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #6a0572; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>
        <br />
        <p>Stay sharp,</p>
        <p><strong>The MasteryZone Team</strong></p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\n==========================================`);
    console.log(`✅ Password Reset email successfully sent to: ${userEmail}`);
    console.log(`🔗 VIEW THE SENT EMAIL HERE: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`==========================================\n`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = {
  sendLoginNotification,
  sendPasswordResetEmail
};
