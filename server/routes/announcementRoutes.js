const express = require('express');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Local Storage Configuration for Announcements
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/announcements';
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

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
            // Store Relative Path for Local Storage
            // Req.file.path is system path (e.g. uploads\announcements\file.pdf)
            // We need web path (e.g. /uploads/announcements/file.pdf)

            // Normalize path separators for URL
            const webPath = req.file.path.replace(/\\/g, '/');

            announcementData.attachmentUrl = `${process.env.BACKEND_URL || ''}/${webPath}`;
            announcementData.attachmentName = req.file.originalname;
            // attachmentPublicId is not needed for local storage, but we can store filename
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
        console.error(e);
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

        // URL Generation for Local Storage is Simple:
        // The URL saved in DB is already the full access path (relative to server root)
        // No need to sign URLs or use Cloudinary.

        // HOWEVER, if we need to prepend the server URL dynamically:
        // Ideally, saving the relative path '/uploads/...' is better, but above we saved full path if BACKEND_URL env is set.
        // For local dev, req.headers.host can be used if we didn't save absolute URL.

        // Let's ensure the URL is accessible.
        // If we saved 'uploads/announcements/file.pdf', we need to make sure the frontend can reach it.
        // The frontend accesses API at /api, but static files are at /uploads.

        const announcementsWithUrls = announcements.map(ann => {
            const annObj = ann.toObject();
            // If stored URL doesn't start with http, prepend current server origin (heuristic)
            if (annObj.attachmentUrl && !annObj.attachmentUrl.startsWith('http')) {
                // Ensure it starts with /
                let url = annObj.attachmentUrl.startsWith('/') ? annObj.attachmentUrl : '/' + annObj.attachmentUrl;

                // If running locally or no BACKEND_URL, might need to rely on relative paths working in frontend 
                // (if frontend proxy is set up) or prepend server address.
                // For safety, let's prepend / if missing, and let frontend handle relative link (to API server domain).

                // Actually, if we are sending JSON, the frontend (React) is running on port 5173, Server on 5000.
                // Relative link '/uploads/...' will go to 5173/uploads/... which is WRONG.
                // We MUST return the full URL including protocol and host.

                const protocol = req.protocol;
                const host = req.get('host');
                const serverUrl = `${protocol}://${host}`;

                // Avoid double slash
                annObj.attachmentUrl = `${serverUrl}${url}`;
            }
            return annObj;
        });

        res.send(announcementsWithUrls);
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

        // Delete File from Local Storage
        if (announcement.attachmentUrl) {
            try {
                // Extract relative path from URL
                // URL might be http://localhost:5000/uploads/announcements/file.pdf
                // or uploads/announcements/file.pdf

                let filePath = announcement.attachmentUrl;
                if (filePath.startsWith('http')) {
                    const urlObj = new URL(filePath);
                    filePath = urlObj.pathname.substring(1); // remove leading /
                } else if (filePath.startsWith('/')) {
                    filePath = filePath.substring(1);
                }

                // Ensure correct separators
                filePath = path.normalize(filePath);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("Error deleting local file:", err);
                // Continue to delete DB record even if file delete fails
            }
        }

        await Announcement.findByIdAndDelete(req.params.id);
        res.send(announcement);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
