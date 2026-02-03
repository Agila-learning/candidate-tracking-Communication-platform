const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['candidate-admin', 'candidate-client', 'admin-client'],
        required: true
    },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }, // Optional for admin-client
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // For candidate-client AND admin-client
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);
