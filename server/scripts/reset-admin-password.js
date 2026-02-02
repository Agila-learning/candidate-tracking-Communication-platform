const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('\n✓ Connected to MongoDB');

        const admin = await User.findOne({ role: 'ADMIN' });
        if (!admin) {
            console.log('\n❌ No admin found. Please run init-admin.js instead to create one.\n');
            process.exit(1);
        }

        console.log(`\nFound Admin: ${admin.email}`);
        console.log('Enter a new password for this account.\n');

        const password = await question('  New Password (min 8 chars): ');

        if (password.length < 8) {
            console.log('\n❌ Password must be at least 8 characters.\n');
            process.exit(1);
        }

        admin.password = password;
        await admin.save();

        console.log('\n✓ Password updated successfully!');
        console.log(`\nYou can now login with: ${admin.email}\n`);

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    }
};

resetAdminPassword();
