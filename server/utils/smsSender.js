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
  console.warn('Twilio package not available. SMS OTP will be logged to console instead.');
}

const sendSmsOtp = async (phoneNumber, otp) => {
  const message = `Your MasteryZone verification code is ${otp}. It will expire in 10 minutes.`;

  if (twilioConfigured) {
    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: fromPhone,
        to: phoneNumber
      });

      console.log(`✅ SMS OTP sent to ${phoneNumber}: ${result.sid}`);
      return { success: true, channel: 'sms', sid: result.sid };
    } catch (error) {
      console.error('Error sending SMS OTP via Twilio:', error.message || error);
      return { success: false, channel: 'sms-error', error: error.message || error };
    }
  }

  console.log(`[Mock SMS] OTP for ${phoneNumber}: ${otp}`);
  return { success: false, channel: 'mock' };
};

module.exports = { sendSmsOtp, twilioConfigured };
