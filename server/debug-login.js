const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fic-banking-forum')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

async function run() {
    try {
        console.log('Fetching recent users...');
        const users = await User.find().sort({ createdAt: -1 }).limit(5).populate('clientId');

        console.log(`Found ${users.length} recent users:`);
        for (const u of users) {
            console.log('------------------------------------------------');
            console.log(`Name: ${u.name}`);
            console.log(`Phone: ${u.phone}`);
            console.log(`Role: ${u.role}`);
            console.log(`Client: ${u.clientId ? u.clientId.name : 'N/A'} (Type: ${u.clientId ? u.clientId.type : 'N/A'})`);
            console.log(`Password Hash: ${u.password ? u.password.substring(0, 20) + '...' : 'MISSING'}`);
            console.log(`Created At: ${u.createdAt}`);

            // Optional: Test a default password if you suspect it
            // const isMatch = await bcrypt.compare('12345678', u.password);
            // console.log('Password is "12345678"?', isMatch);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

run();
