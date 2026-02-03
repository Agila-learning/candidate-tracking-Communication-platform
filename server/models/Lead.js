const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    location: { type: String },
    stage: {
        type: String,
        enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Dropped'],
        default: 'New'
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phase: { type: String, default: 'Phase 1' },
    targetBank: { type: String },
    notes: { type: String },
    followUpDate: { type: Date },
    tags: [String],
    tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
