const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const Client = require('../models/Client'); // Bank Client Model
const Candidate = require('../models/Candidate');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const seedUsers = async () => {
    try {
        console.log('\n--- Production User Seeding ---\n');

        const uri = await question('Paste your Production MONGODB_URI here: ');

        if (!uri.includes('mongodb')) {
            console.error('❌ That does not look like a valid MongoDB URI.');
            process.exit(1);
        }

        console.log('\nConnecting to MongoDB Atlas...');
        await mongoose.connect(uri.trim());
        console.log('✅ Connected!');

        // 1. Create a Bank Client (The Organization)
        let axisBank = await Client.findOne({ name: 'Axis Bank' });
        if (!axisBank) {
            axisBank = new Client({
                name: 'Axis Bank',
                description: 'Leading Private Sector Bank',
                pocName: 'Rahul Dravid',
                pocEmail: 'rahul@axis.com',
                pocPhone: '9876543210',
                isActive: true
            });
            await axisBank.save();
            console.log('✅ Created Bank: Axis Bank');
        } else {
            console.log('ℹ️  Using existing Bank: Axis Bank');
        }

        // 2. Create Client Support User (Login as Bank)
        const clientEmail = 'client@axis.com';
        const clientPass = 'client123';
        let clientUser = await User.findOne({ email: clientEmail });
        if (!clientUser) {
            clientUser = new User({
                name: 'Bank Manager',
                email: clientEmail,
                password: clientPass,
                role: 'CLIENT_SUPPORT',
                clientId: axisBank._id,
                isActive: true
            });
            await clientUser.save();
            console.log(`✅ Created Client User: ${clientEmail} / ${clientPass}`);
        } else {
            console.log(`ℹ️  Client User exists: ${clientEmail}`);
            clientUser.password = clientPass;
            await clientUser.save();
            console.log('   (Password reset to client123)');
        }

        // 3. Create Candidate User
        const candEmail = 'candidate@gmail.com';
        const candPass = 'cand123';
        let candUser = await User.findOne({ email: candEmail });
        if (!candUser) {
            candUser = new User({
                name: 'Arjun Reddy',
                email: candEmail,
                password: candPass,
                role: 'CANDIDATE',
                clientId: axisBank._id, // Linked to Axis Bank
                isActive: true
            });
            await candUser.save();
            console.log(`✅ Created Candidate User: ${candEmail} / ${candPass}`);
        } else {
            console.log(`ℹ️  Candidate User exists: ${candEmail}`);
            candUser.password = candPass;
            await candUser.save();
            console.log('   (Password reset to cand123)');
        }

        console.log('\n-----------------------------------');
        console.log('LOGIN DETAILS:');
        console.log(`Bank Client:   ${clientEmail}  /  ${clientPass}`);
        console.log(`Candidate:     ${candEmail}    /  ${candPass}`);
        console.log('-----------------------------------');

        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    }
};

seedUsers();
