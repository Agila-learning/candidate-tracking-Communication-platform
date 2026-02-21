const mongoose = require('mongoose');

const clientRequestSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactName: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    roleType: { type: String, required: true }, // e.g. "Banking Operations", "IT Support"
    headcount: { type: Number, default: 1 },
    description: { type: String },
    status: {
        type: String,
        enum: ['PENDING', 'SEEN', 'IN_PROGRESS', 'FULFILLED'],
        default: 'PENDING'
    },
    adminNotes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClientRequest', clientRequestSchema);
