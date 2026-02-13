const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['Document', 'Link', 'Announcement'], required: true },
    url: { type: String }, // For Links
    fileUrl: { type: String }, // For Cloudinary URL
    publicId: { type: String }, // For Cloudinary deletion
    originalName: { type: String }, // For display
    programName: { type: String }, // Optional: Link to a specific program
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // Links to a specific bank
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);
