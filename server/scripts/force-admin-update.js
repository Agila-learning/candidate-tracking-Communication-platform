const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fic_banking';

const forceUpdateAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected');

        const phone = '6369406416';
        const password = '6369506416';

        let admin = await User.findOne({ phone: phone });
        if (admin) {
            admin.password = password;
            await admin.save();
            console.log('Admin password updated.');
        } else {
            console.log('Admin not found, creating...');
            admin = new User({
                name: 'Super Admin',
                phone: phone,
                password: password,
                role: 'ADMIN',
                isActive: true
            });
            await admin.save();
            console.log('Admin created.');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

forceUpdateAdmin();
