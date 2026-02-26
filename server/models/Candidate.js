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
    email: { type: String },         // Optional for agent-referred candidates
    location: { type: String },
    qualification: { type: String },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    manualPartnerName: { type: String }, // F3: Free-text partner when 'Others' is selected
    programName: { type: String }, // e.g., Axis YBP
    resumeUrl: { type: String }, // Cloudinary URL
    resumePublicId: { type: String }, // For signed URLs
    resumeOriginalName: { type: String },
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
        public_id: String, // Cloudinary public_id for deletion
        uploadedAt: { type: Date, default: Date.now }
    }],
    statusHistory: [statusHistorySchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referredBy: { type: String },
    creationComments: { type: String }, // Optional comments added during candidate creation
    interviewFeedback: { type: String }, // Feedback added by HR after interview
    isActive: { type: Boolean, default: true } // Admin can enable/disable candidate access
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
