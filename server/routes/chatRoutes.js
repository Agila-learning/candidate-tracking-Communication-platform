const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

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
            conversation = new Conversation({
                type,
                candidateId,
                clientId: target === 'client' ? candidateDoc.clientId : undefined,
                participants: [req.user._id]
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

module.exports = router;
