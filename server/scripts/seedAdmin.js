require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const phone = '6369406416';
        const password = '6369406416';
        const email = 'admin@fic.com'; // Placeholder email

        let user = await User.findOne({ phone });

        if (user) {
            console.log('User found, updating password...');
            user.password = password;
            user.role = 'ADMIN';
            // ensure email is set if missing (though schema requires it)
            if (!user.email) user.email = email;
            await user.save();
            console.log('Admin user updated');
        } else {
            // Check if email exists
            user = await User.findOne({ email });
            if (user) {
                console.log('User with email found, updating phone...');
                user.phone = phone;
                user.password = password;
                user.role = 'ADMIN';
                await user.save();
                console.log('Admin user updated with phone number');
            } else {
                console.log('Creating new admin user...');
                user = new User({
                    name: 'Admin',
                    email,
                    phone,
                    password,
                    role: 'ADMIN',
                    isActive: true
                });
                await user.save();
                console.log('Admin user created');
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
