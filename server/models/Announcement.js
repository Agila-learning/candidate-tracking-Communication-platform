const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'], required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // Required if sender is CLIENT_SUPPORT
    title: { type: String, required: true },
    message: { type: String, required: true },
    attachmentUrl: { type: String }, // URL from Cloudinary
    attachmentName: { type: String }, // Original filename
    isGlobal: { type: Boolean, default: false }, // True if Admin sends it
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
