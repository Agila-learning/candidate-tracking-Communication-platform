require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const phone = '6369406416';
        const password = '6369406416';
        const role = 'ADMIN';

        // 1. Find and DELETE existing user with this phone
        await User.deleteOne({ phone });
        console.log('Removed existing user with phone:', phone);

        // 2. Find and DELETE existing user with the temporary email (if any)
        await User.deleteOne({ email: 'admin@fic.com' });
        console.log('Removed existing user with email: admin@fic.com');

        // 3. Create fresh admin user
        const newAdmin = new User({
            name: 'Super Admin',
            phone: phone,
            password: password,
            role: role,
            isActive: true,
            // email is optional now, so we can omit it if desired, or provide a dummy one if needed for unique index (sparse handles null/omitted)
            // But let's provide a unique placeholder just in case
            email: `admin_${Date.now()}@fic.banking`
        });

        await newAdmin.save();
        console.log('Successfully created new Admin user:');
        console.log(`Phone: ${phone}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
