const express = require('express');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Create Announcement
router.post('/', auth, upload.single('attachment'), async (req, res) => {
    try {
        const { title, message } = req.body;

        let announcementData = {
            senderId: req.user._id,
            senderRole: req.user.role,
            title,
            message
        };

        if (req.file) {
            announcementData.attachmentUrl = req.file.path;
            announcementData.attachmentName = req.file.originalname;
            announcementData.attachmentPublicId = req.file.filename;
        }

        if (req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_FIC') {
            announcementData.isGlobal = true;
        } else if (req.user.role === 'CLIENT_SUPPORT') {
            if (!req.user.clientId) {
                return res.status(403).send({ error: 'Client ID missing for user' });
            }
            announcementData.clientId = req.user.clientId;
            announcementData.isGlobal = false;
        } else {
            return res.status(403).send({ error: 'Not authorized to post announcements' });
        }

        const announcement = new Announcement(announcementData);
        await announcement.save();
        res.status(201).send(announcement);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get Announcements
router.get('/', auth, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_FIC') {
            // Admin sees all
        } else if (req.user.role === 'CLIENT_SUPPORT') {
            // Client sees ONLY Their Own
            query = { clientId: req.user.clientId };
        } else if (req.user.role === 'CANDIDATE') {
            const Candidate = require('../models/Candidate');
            const candidate = await Candidate.findOne({ userId: req.user._id });

            if (candidate && candidate.clientId) {
                // See Global + Client Specific
                query = {
                    $or: [
                        { isGlobal: true },
                        { clientId: candidate.clientId }
                    ]
                };
            } else {
                // See only Global
                query = { isGlobal: true };
            }
        }

        const announcements = await Announcement.find(query)
            .sort({ createdAt: -1 })
            .populate('senderId', 'username role') // basic info
            .populate('clientId', 'name');

        // Generate Signed URLs for attachments
        const announcementsWithSignedUrls = announcements.map(ann => {
            const annObj = ann.toObject();
            if (annObj.attachmentPublicId) {
                const { cloudinary } = require('../config/cloudinary');

                // Determine resource type and access type
                // If it's a raw file (PDF, Doc), it was uploaded as 'authenticated' (private)
                // If it's an image, it was uploaded as 'upload' (public)

                // We can check the URL for '/raw/' to be sure, or rely on our config logic.
                const isRaw = annObj.attachmentUrl && annObj.attachmentUrl.includes('/raw/');

                annObj.attachmentUrl = cloudinary.url(annObj.attachmentPublicId, {
                    resource_type: isRaw ? 'raw' : 'image',
                    type: isRaw ? 'authenticated' : 'upload', // CRITICAL: Must match upload type
                    sign_url: true,
                    secure: true,
                    // flags: isRaw ? 'attachment' : undefined // Optional: forces download
                });
            }
            return annObj;
        });

        res.send(announcementsWithSignedUrls);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

// Delete Announcement
router.delete('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).send();

        // Authority Check
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_FIC') {
            // Can delete any
        } else if (req.user.role === 'CLIENT_SUPPORT') {
            if (announcement.senderId.toString() !== req.user._id.toString()) {
                return res.status(403).send({ error: 'Can only delete your own announcements' });
            }
        } else {
            return res.status(403).send();
        }

        await Announcement.findByIdAndDelete(req.params.id);
        res.send(announcement);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
