const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const findAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'ADMIN' });
        if (admin) {
            console.log('ADMIN_FOUND:', admin.email);
        } else {
            console.log('ADMIN_NOT_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findAdmin();
