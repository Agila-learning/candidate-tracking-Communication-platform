const mongoose = require('mongoose');

async function run() {
    try {
        require('dns').setServers(['8.8.8.8', '8.8.4.4']); // try to fix ENOTFOUND locally
        const uri = "mongodb+srv://Forge-India:K8sJz45S!Q1o@cluster0.p7e9d.mongodb.net/FIC_Database?retryWrites=true&w=majority&appName=Cluster0";
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({ name: /sakthi/i }).toArray();
        console.log(`\nFound ${users.length} Sakthi users:`);
        for (const u of users) {
            console.log(`- ID: ${u._id}, Role: ${u.role}, ClientId: ${u.clientId}`);
            if (u.clientId) {
                const client = await db.collection('clients').findOne({ _id: u.clientId });
                console.log(`  -> Client Type: ${client?.type}, Name: ${client?.name}`);
            }

            // Check chats where Sakthi is explicitly a participant
            const chats = await db.collection('conversations').find({ participants: u._id }).toArray();
            console.log(`  -> Participant in ${chats.length} chats`);
            if (chats.length > 0) {
                console.log(`  -> Example Chat ID: ${chats[0]._id}, Type: ${chats[0].type}`);
            }

            // Check chats fetched by HR / FIC_HR logic
            const hrQuery = {
                $or: [
                    { type: 'agent-hr' },
                    { type: 'candidate-admin' },
                    { type: 'candidate-client' },
                    { participants: u._id }
                ]
            };
            const hrChats = await db.collection('conversations').find(hrQuery).toArray();
            console.log(`  -> HR Query finds: ${hrChats.length} chats total`);
        }

    } catch (e) { console.error('Error:', e); }
    finally { await mongoose.disconnect(); console.log('Done.'); }
}
run();
