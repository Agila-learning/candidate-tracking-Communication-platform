const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
require('./models/Client');
require('./models/User');
require('./models/Candidate');
require('./models/Lead');
const Conversation = require('./models/Conversation');

dotenv.config({ path: './.env' });

const checkConversations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fic_banking');
        const convs = await Conversation.find().populate('candidateId clientId');
        let out = `Total: ${convs.length}\n`;
        convs.forEach(c => {
            out += `TYPE: ${c.type} | CAND: ${c.candidateId?.name} | BANK: ${c.clientId?.name} | ID: ${c._id}\n`;
        });
        fs.writeFileSync('server/audit_log.txt', out, 'utf8');
        process.exit();
    } catch (err) { console.error(err); process.exit(1); }
};
checkConversations();
