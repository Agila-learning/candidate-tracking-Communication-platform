const mongoose = require('mongoose');
const Client = require('../models/Client');
require('dotenv').config();

const clients = [
    { name: 'Axis Bank', description: 'Axis Bank Partner' },
    { name: 'HDFC Bank', description: 'HDFC Bank Partner' },
    { name: 'ICICI Bank', description: 'ICICI Bank Partner' },
    { name: 'SBI', description: 'State Bank of India' },
    { name: 'Kotak Mahindra', description: 'Kotak Mahindra Bank' }
];

const seedClients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const clientData of clients) {
            const existing = await Client.findOne({ name: clientData.name });
            if (!existing) {
                await Client.create(clientData);
                console.log(`Created: ${clientData.name}`);
            } else {
                console.log(`Skipped: ${clientData.name} (Already exists)`);
            }
        }

        console.log('Client seeding completed.');
        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedClients();
