const dotenv = require('dotenv');
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
let twilioConfigured = false;
try {
  if (accountSid && authToken && fromPhone) {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    twilioConfigured = true;
  }
} catch (err) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Twilio package not available or unconfigured.");
  }
}

const sendSmsOtp = async (phoneNumber, otp) => {
  const message = `Your MasteryZone verification code is ${otp}. It will expire in 10 minutes.`;

  if (twilioConfigured) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: fromPhone,
        to: phoneNumber,
      });

      console.log(`✅ SMS OTP dispatched to ${phoneNumber.slice(0, 3)}***${phoneNumber.slice(-2)}`);
      return { success: true, channel: "sms", sid: result.sid };
    } catch (error) {
      console.error("Error sending SMS OTP via Twilio:", error.message || error);
      return { success: false, channel: "sms-error", error: error.message || error };
    }
  }

  // In production, reject unconfigured SMS provider fail-closed without leaking OTP
  if (process.env.NODE_ENV === "production") {
    console.warn(`[SMS Alert] Cannot dispatch SMS to ${phoneNumber.slice(0, 3)}***${phoneNumber.slice(-2)}: SMS provider not configured.`);
    return { success: false, channel: "unconfigured", error: "SMS service not configured in production" };
  }

  // Non-production test mode
  if (process.env.ALLOW_MOCK_SMS === "true") {
    return { success: true, channel: "mock-test" };
  }

  return { success: false, channel: "unconfigured" };
};

module.exports = { sendSmsOtp, twilioConfigured };
