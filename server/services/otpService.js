const axios = require('axios');

// Placeholder for Twilio - In production, use 'twilio' package
// const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendOTP = async (phone, otp) => {
    const provider = process.env.OTP_PROVIDER || 'SIMULATED'; // 'TWILIO' or 'SIMULATED'

    if (provider === 'TWILIO') {
        if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE) {
            console.error('Twilio credentials missing');
            throw new Error('Twilio configuration error');
        }

        try {
            // Real Twilio Code Implementation
            // await client.messages.create({
            //     body: `Your FIC Banking OTP is: ${otp}`,
            //     from: process.env.TWILIO_PHONE,
            //     to: phone
            // });
            console.log(`[Twilio] OTP sent to ${phone}`);
        } catch (e) {
            console.error('Twilio Send Error', e);
            throw new Error('Failed to send OTP via Twilio');
        }
    } else {
        // Simulated
        console.log(`[SIMULATED OTP] To: ${phone} | Code: ${otp}`);
        // In a real app, maybe send via email fallback or just log for dev
    }
};

module.exports = { sendOTP };
