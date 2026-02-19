const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Email is now optional
    phone: { type: String, required: true, unique: true }, // Phone is mandatory
    otp: { type: String },
    otpExpires: { type: Date },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['ADMIN', 'SUB_ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT', 'AGENCY_ADMIN', 'AGENT', 'CANDIDATE'],
        default: 'CANDIDATE'
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // For CLIENT_SUPPORT and CANDIDATE
    isActive: { type: Boolean, default: true }, // Admin can enable/disable user access
    lastLogin: { type: Date }, // Track last login timestamp
    createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
userSchema.index({ email: 1, isActive: 1 });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
