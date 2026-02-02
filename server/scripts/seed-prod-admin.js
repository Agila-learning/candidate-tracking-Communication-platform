const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // Try to load .env, but we will prompt anyway

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const seedAdmin = async () => {
    try {
        console.log('\n--- Production Admin Setup ---\n');
        console.log('We need to connect to your LIVE Atlas Database to create the admin user.\n');

        const uri = await question('Paste your Production MONGODB_URI here: ');

        if (!uri.includes('mongodb')) {
            console.error('❌ That does not look like a valid MongoDB URI.');
            process.exit(1);
        }

        console.log('\nConnecting to MongoDB Atlas...');
        await mongoose.connect(uri.trim());
        console.log('✅ Connected!');

        const email = 'admin@fic.com';
        const password = 'admin123';

        // Check if admin exists
        let admin = await User.findOne({ role: 'ADMIN' });

        if (admin) {
            console.log(`\nFound existing Admin: ${admin.email}`);
            console.log('Resetting password to: admin123');
            admin.password = password; // Will be hashed by pre-save hook
            await admin.save();
            console.log('✅ Password Reset Successfully!');
        } else {
            console.log('\nCreating NEW Admin user...');
            admin = new User({
                name: 'FIC Admin',
                email: email,
                password: password,
                role: 'ADMIN',
                isActive: true
            });
            await admin.save();
            console.log('✅ Admin User Created Successfully!');
        }

        console.log('\n-----------------------------------');
        console.log('LOGIN DETAILS:');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('-----------------------------------');

        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    }
};

seedAdmin();
