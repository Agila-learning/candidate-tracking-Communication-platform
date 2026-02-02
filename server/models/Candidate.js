const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    oldStatus: String,
    newStatus: String,
    remark: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

const candidateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String },
    qualification: { type: String },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    programName: { type: String }, // e.g., Axis YBP
    currentStatus: {
        type: String,
        enum: [
            'Registered', 'Documents Collected', 'Training In Progress',
            'Training Completed', 'Interview Scheduled', 'Interview Attended',
            'Interview Cleared', 'Offer Released', 'Joining Confirmed',
            'Joined', 'Rejected / Dropped'
        ],
        default: 'Registered'
    },
    interview: {
        dateTime: Date,
        mode: { type: String, enum: ['Online', 'Offline'] },
        locationOrLink: String,
        pocName: String,
        remarks: String
    },
    nextActionDate: Date,
    documents: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    statusHistory: [statusHistorySchema],
    isActive: { type: Boolean, default: true }, // Admin can enable/disable candidate access
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

candidateSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Candidate', candidateSchema);
