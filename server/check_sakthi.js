const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Conversation = require('./models/Conversation');
require('dotenv').config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB cluster');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Available Databases:');
        dbs.databases.forEach(db => console.log(`- ${db.name}`));

        // For each interesting database, list user count
        for (const dbInfo of dbs.databases) {
            const db = mongoose.connection.client.db(dbInfo.name);
            const userCount = await db.collection('users').countDocuments();
            console.log(`Database: ${dbInfo.name}, User Count: ${userCount}`);
        }

        const users = await User.find({}).populate('clientId');
        console.log(`\nFound ${users.length} users total`);
        users.forEach(u => {
            console.log(`User: ${u.name}, Role: ${u.role}, Client: ${u.clientId?.name} (${u.clientId?.type})`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

checkUser();
