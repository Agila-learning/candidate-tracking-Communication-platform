require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'agila@gmail.com';
        const phone = '6381198168';

        const candidates = await Candidate.find({ $or: [{ email }, { phone }] });
        console.log(`Found ${candidates.length} candidates matching ${email} or ${phone}`);
        candidates.forEach(c => console.log(`- ${c._id}: ${c.name} (${c.email})`));

        const users = await User.find({ $or: [{ email }, { phone }] });
        console.log(`Found ${users.length} users matching ${email} or ${phone}`);
        users.forEach(u => console.log(`- ${u._id}: ${u.name} (${u.email})`));

        if (candidates.length > 0) {
            console.log('Attempting to delete duplicate candidates...');
            // await Candidate.deleteMany({ _id: { $in: candidates.map(c => c._id) } });
            // console.log('Deleted duplicates.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

run();
