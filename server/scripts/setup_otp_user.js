const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fic_banking';
console.log('Connecting to MongoDB:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const testPhone = '9876543210';
        const testEmail = 'otp_test@example.com';

        // Check if user exists
        let user = await User.findOne({ phone: testPhone });

        if (!user) {
            console.log(`User with phone ${testPhone} not found. Creating one...`);
            // Check if email exists
            const existingEmail = await User.findOne({ email: testEmail });
            if (existingEmail) {
                console.log(`User with email ${testEmail} exists. Updating phone...`);
                existingEmail.phone = testPhone;
                await existingEmail.save();
                user = existingEmail;
            } else {
                user = new User({
                    name: 'OTP Test User',
                    email: testEmail,
                    phone: testPhone,
                    password: 'Password123!',
                    role: 'CANDIDATE',
                    isActive: true
                });
                await user.save();
                console.log('Created new test user.');
            }
        } else {
            console.log(`User found: ${user.name} (${user.phone})`);
        }

        console.log('---------------------------------------------------');
        console.log('Test User Ready for OTP Login:');
        console.log('Phone Number:', testPhone);
        console.log('---------------------------------------------------');
        console.log('You can now use the frontend "Login with Mobile" option.');
        console.log('Enter the phone number above.');
        console.log('Then check "server/otp_log.txt" for the OTP code.');
        console.log('---------------------------------------------------');

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
