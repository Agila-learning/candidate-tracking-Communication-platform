const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Bank name like 'Axis', 'HDFC'
    description: { type: String },
    pocName: { type: String },
    pocEmail: { type: String },
    pocPhone: { type: String },
    isActive: { type: Boolean, default: true }, // Admin can enable/disable client
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);
