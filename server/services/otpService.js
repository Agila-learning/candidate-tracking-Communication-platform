const axios = require('axios');

// Placeholder for Twilio - In production, use 'twilio' package
// const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const fs = require('fs');
const path = require('path');

const sendOTP = async (phone, otp) => {
    // FORCE LOCAL / SIMULATED MODE
    // We are strictly not using any third party website as per requirements.

    const otpMessage = `[OTP SERVICE] Your One-Time Password for Login: ${otp}\nSentinel ID: ${Date.now()}\nPhone: ${phone}\n------------------------\n`;

    // Log to console
    console.log(otpMessage);

    // Write to a file for easy access (simulating receiving an SMS on a device)
    const filePath = path.join(__dirname, '../otp_log.txt');
    try {
        fs.appendFileSync(filePath, otpMessage);
        console.log(`OTP written to ${filePath}`);
    } catch (err) {
        console.error('Failed to write OTP to file:', err);
    }
};

module.exports = { sendOTP };
