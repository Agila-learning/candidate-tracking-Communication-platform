const mongoose = require('mongoose');
const Client = require('../models/Client');
const User = require('../models/User');

require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fic-banking-forum')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const fs = require('fs');

async function run() {
    try {
        let output = '--- Diagnosing Partners & Users ---\n';

        const clients = await Client.find().sort({ createdAt: -1 });
        output += `Total Clients (Partners): ${clients.length}\n`;

        let missingUsersCount = 0;

        for (const client of clients) {
            // Find users associated with this client
            const users = await User.find({ clientId: client._id });

            const status = users.length > 0 ? 'OK' : 'MISSING USER';
            if (users.length === 0) missingUsersCount++;

            output += `\nClient: ${client.name} (${client.type || 'BANKING'})\n`;
            // The original line `console.log(`  ID: ${client._id}`);` is intentionally removed as per the instruction's output structure.
            output += `  POC: ${client.pocName} / ${client.pocPhone}\n`;
            output += `  Status: ${status}\n`;

            if (users.length > 0) {
                users.forEach(u => {
                    const passStatus = u.password ? (u.password.length > 20 ? 'HASHED' : 'PLAIN/SHORT') : 'MISSING';
                    const phoneMatch = u.phone === client.pocPhone ? 'MATCH' : 'MISMATCH';
                    output += `    -> User: ${u.name} | Phone: ${u.phone} (${phoneMatch}) | Role: ${u.role} | Pwd: ${passStatus}\n`;
                });
            } else {
                output += `    -> ⚠️ NO LOGIN USER FOUND. This partner cannot log in.\n`;
            }
        }

        output += '\n------------------------------------------------\n';
        output += `Summary: ${missingUsersCount} partners have no user account.\n`;
        output += '------------------------------------------------\n';

        fs.writeFileSync('diagnosis_report.txt', output);
        console.log('Report written to diagnosis_report.txt');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

run();
