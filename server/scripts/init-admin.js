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

const initAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('\n✓ Connected to MongoDB');

        const existingAdmin = await User.findOne({ role: 'ADMIN' });
        if (existingAdmin) {
            console.log('\n⚠️  Admin already exists:');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log('\nUse existing admin to login and manage users.\n');
            process.exit(0);
        }

        console.log('\n=== First Time Setup ===\n');
        console.log('Create your admin account:\n');

        const name = await question('  Name: ');
        const email = await question('  Email: ');
        const password = await question('  Password (min 8 chars): ');

        if (!name || !email || password.length < 8) {
            console.log('\n✗ Invalid input. Name, email required. Password min 8 chars.\n');
            process.exit(1);
        }

        const admin = new User({ name, email, password, role: 'ADMIN' });
        await admin.save();

        console.log('\n✓ Admin created successfully!');
        console.log('\n=== Your Credentials ===');
        console.log(`  Email: ${email}`);
        console.log(`  Password: ${password}`);
        console.log('\n⚠️  Save these credentials securely!\n');
        console.log('Next: Login to dashboard and create users/clients.\n');

        process.exit(0);
    } catch (err) {
        console.error('\n✗ Error:', err.message);
        process.exit(1);
    }
};

initAdmin();
