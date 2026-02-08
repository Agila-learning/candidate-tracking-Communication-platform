const mongoose = require('mongoose');
const Client = require('../models/Client');
require('dotenv').config();

const checkClients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const clients = await Client.find({});
        console.log(`Total Clients Found: ${clients.length}`);

        clients.forEach(c => {
            console.log(`- ${c.name} (ID: ${c._id}, Active: ${c.isActive})`);
        });

        if (clients.length === 0) {
            console.log('Use data:seed script or Admin Dashboard to create clients.');
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkClients();
