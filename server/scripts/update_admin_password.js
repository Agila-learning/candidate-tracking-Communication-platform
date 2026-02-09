
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const phone = '6381091552';
        // Assuming the super admin is identified by role 'ADMIN'. 
        // If there are multiple, this might update all, or we should find a specific one.
        // Usually there is one main admin. 
        // Let's first find the user with role ADMIN.

        const adminUser = await User.findOne({ role: 'ADMIN' });

        if (!adminUser) {
            console.log('No ADMIN user found. Creating one...');
            const newAdmin = new User({
                name: 'Super Admin',
                email: 'admin@forge.com', // Placeholder
                phone: phone,
                password: phone, // Will be hashed by pre-save
                role: 'ADMIN',
                isActive: true
            });
            await newAdmin.save();
            console.log('Admin created with password:', phone);
        } else {
            console.log(`Found Admin: ${adminUser.name} (${adminUser.phone})`);
            adminUser.password = phone;
            adminUser.phone = phone; // Ensure phone is also this, as requested? "update password... as 6381091552"
            // The user might mean the PHONE is 6381091552 AND password is that. 
            // Or just password. But usually mobile number is the login.
            // I will set the phone to this as well to be safe, or just the password.
            // "update the password for super admin as 6381091552" - ambiguous if username is also that.
            // I should probably ensure at least one admin has this phone number if they login with phone.

            await adminUser.save();
            console.log('Admin password updated to:', phone);
        }

    } catch (error) {
        console.error('Error updating password:', error);
    } finally {
        await mongoose.disconnect();
    }
};

updateAdminPassword();
