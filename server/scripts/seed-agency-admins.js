const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fic_banking';

const agencyAdmins = [
    { name: 'Agency Admin 1', phone: '9900000001', email: 'agency1@test.com', role: 'AGENCY_ADMIN' },
    { name: 'Agency Admin 2', phone: '9900000002', email: 'agency2@test.com', role: 'AGENCY_ADMIN' },
    { name: 'Agency Admin 3', phone: '9900000003', email: 'agency3@test.com', role: 'AGENCY_ADMIN' },
    { name: 'Agency Admin 4', phone: '9900000004', email: 'agency4@test.com', role: 'AGENCY_ADMIN' },
    { name: 'Agency Admin 5', phone: '9900000005', email: 'agency5@test.com', role: 'AGENCY_ADMIN' }
];

const seedAgencyAdmins = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`Connected to MongoDB at ${MONGODB_URI}`);

        for (const admin of agencyAdmins) {
            const exists = await User.findOne({ phone: admin.phone });
            if (!exists) {
                const user = new User({
                    name: admin.name,
                    phone: admin.phone,
                    email: admin.email,
                    role: admin.role,
                    password: admin.phone, // Password same as phone
                    isActive: true
                });
                await user.save();
                console.log(`Created: ${admin.name} (${admin.phone})`);
            } else {
                console.log(`Skipped (Exists): ${admin.name}`);
            }
        }

        console.log('Seeding complete');
        process.exit(0);
    } catch (e) {
        console.error('Seed error:', e);
        process.exit(1);
    }
};

seedAgencyAdmins();
