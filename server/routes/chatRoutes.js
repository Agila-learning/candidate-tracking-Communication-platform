const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { auth, authorize } = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');

const router = express.Router();

// List My Conversations
router.get('/my', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_FIC') {
            // No type filter needed for admins, they see all
        } else if (req.user.role === 'CLIENT_SUPPORT') {
            // Client sees candidate chats AND admin chats
            query.clientId = req.user.clientId;
            // No type restriction (or restrict to exclude others if needed, but client only has these two types anyway)
        } else if (req.user.role === 'CANDIDATE') {
            const Candidate = require('../models/Candidate');
            const candidate = await Candidate.findOne({ userId: req.user._id });
            if (!candidate) return res.send([]);
            query.candidateId = candidate._id;
        }

        const conversations = await Conversation.find(query)
            .populate('candidateId')
            .populate('clientId')
            .sort({ lastMessageAt: -1 });
        res.send(conversations);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Create/Get Admin-Client Chat
router.post('/client/:clientId/admin', auth, async (req, res) => {
    try {
        const { clientId } = req.params;
        const type = 'admin-client';

        let conversation = await Conversation.findOne({ type, clientId });

        if (!conversation) {
            // Find Bank Users to add as participants
            const User = require('../models/User');
            const bankUsers = await User.find({ clientId, role: 'CLIENT_SUPPORT' });
            const participantIds = [req.user._id, ...bankUsers.map(u => u._id)];

            conversation = new Conversation({
                type,
                clientId,
                participants: participantIds
            });
            await conversation.save();
        }
        res.send(conversation);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get or Create Channel (Generic Candidate)
router.post('/candidate/:candidateId/:target', auth, async (req, res) => {
    try {
        const { candidateId, target } = req.params; // target: 'admin' or 'client'
        const type = `candidate-${target}`;

        const Candidate = require('../models/Candidate');
        const candidateDoc = await Candidate.findById(candidateId);
        if (!candidateDoc) return res.status(404).send({ error: 'Candidate not found' });

        let query = { type, candidateId };
        if (target === 'client') query.clientId = candidateDoc.clientId;

        let conversation = await Conversation.findOne(query);

        if (!conversation) {
            let participantIds = [req.user._id];

            // If chat is with Bank/Client, add all their support users to participants so they get notifications
            if (target === 'client' && candidateDoc.clientId) {
                const User = require('../models/User');
                const bankUsers = await User.find({ clientId: candidateDoc.clientId, role: 'CLIENT_SUPPORT' });
                const bankUserIds = bankUsers.map(u => u._id);
                // Merge and dedupe
                participantIds = [...new Set([...participantIds, ...bankUserIds])];
            }

            conversation = new Conversation({
                type,
                candidateId,
                clientId: target === 'client' ? candidateDoc.clientId : undefined,
                participants: participantIds
            });
            await conversation.save();
        }
        res.send(conversation);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Fetch Messages
router.get('/messages/:conversationId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        }).sort({ createdAt: 1 });
        res.send(messages);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Send Message
router.post('/messages', auth, async (req, res) => {
    try {
        const message = new Message({
            ...req.body,
            senderId: req.user._id
        });
        await message.save();

        const conversation = await Conversation.findById(req.body.conversationId);
        if (conversation) {
            conversation.lastMessage = req.body.text;
            conversation.lastMessageAt = Date.now();

            // Increment unread for participants except sender
            conversation.participants.forEach(pId => {
                if (pId.toString() !== req.user._id.toString()) {
                    const current = conversation.unreadCounts.get(pId.toString()) || 0;
                    conversation.unreadCounts.set(pId.toString(), current + 1);
                }
            });
            await conversation.save();
        }

        res.status(201).send(message);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Mark Read
router.patch('/read/:id', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).send();

        conversation.unreadCounts.set(req.user._id.toString(), 0);
        await conversation.save();
        res.send(conversation);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Upload Audio
router.post('/upload-audio', auth, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ error: 'No audio file uploaded' });

        // Multer-storage-cloudinary has already uploaded it.
        // We just need to return the URL and public_id.
        res.send({
            url: req.file.path,
            public_id: req.file.filename,
            name: 'Voice Message'
        });
    } catch (e) {
        console.error('Audio upload error:', e);
        res.status(400).send({ error: e.message });
    }
});

// Delete Message
router.delete('/messages/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).send();

        // Check permission: Admin or Sender
        if (req.user.role !== 'ADMIN' && message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).send({ error: 'Unauthorized to delete this message' });
        }

        // Delete attachments from Cloudinary
        if (message.attachments && message.attachments.length > 0) {
            for (const attachment of message.attachments) {
                if (attachment.public_id) {
                    try {
                        let resourceType = 'image';
                        if (attachment.type === 'audio') resourceType = 'video'; // Cloudinary treats audio as video
                        else if (attachment.type === 'doc' || attachment.type === 'pdf') resourceType = 'raw';

                        await cloudinary.uploader.destroy(attachment.public_id, { resource_type: resourceType });
                    } catch (err) {
                        console.error('Failed to delete file from Cloudinary:', err);
                    }
                }
            }
        }

        // Actually, looking at resourceRoutes, we stored publicId in Resource model.
        // in Chat, we probably didn't store public_id in Message model.
        // Let's check Message model first.

        await Message.findByIdAndDelete(req.params.id);
        res.send(message);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Delete Conversation (Admin Only)
router.delete('/conversations/:id', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).send();

        // 1. Find all messages
        const messages = await Message.find({ conversationId: conversation._id });

        // 2. Delete all attachments from Cloudinary
        for (const message of messages) {
            if (message.attachments && message.attachments.length > 0) {
                for (const attachment of message.attachments) {
                    if (attachment.public_id) {
                        try {
                            let resourceType = 'image';
                            if (attachment.type === 'audio') resourceType = 'video';
                            else if (attachment.type === 'doc' || attachment.type === 'pdf') resourceType = 'raw';

                            await cloudinary.uploader.destroy(attachment.public_id, { resource_type: resourceType });
                        } catch (err) {
                            console.error('Failed to delete file from Cloudinary during conversation delete:', err);
                        }
                    }
                }
            }
        }

        // 3. Delete all messages
        await Message.deleteMany({ conversationId: conversation._id });

        // 4. Delete conversation
        await Conversation.findByIdAndDelete(req.params.id);

        res.send({ message: 'Conversation deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

module.exports = router;
