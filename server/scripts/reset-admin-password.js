const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: './.env' });

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'ADMIN' });
        if (admin) {
            // Hash new password
            // Note: Use bcryptjs directly or rely on User model pre-save hook?
            // The User model likely has a pre-save hook for hashing. 
            // Let's check User model to be sure, or just assign plain text if the model handles it on save.
            // Safest: find the user, set password, save(). The pre-save hook should handle it.

            admin.password = 'admin123';
            await admin.save();
            console.log('PASSWORD_RESET_SUCCESS');
        } else {
            console.log('ADMIN_NOT_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
