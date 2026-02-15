const express = require('express');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { validateCandidate } = require('../middleware/validators');
const { maskPhone } = require('../utils/masking');
const { upload, cloudinary } = require('../config/cloudinary');

const router = express.Router();

// Candidate Self-Registration (Create Profile)
router.post('/create-profile', auth, async (req, res) => {
    try {
        // Check if profile already exists
        const existing = await Candidate.findOne({ userId: req.user._id });
        if (existing) return res.status(400).json({ error: 'Profile already exists' });

        const { location, programName } = req.body;

        const candidate = new Candidate({
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone, // Phone is now mandatory in User, so it's safe
            location: location || 'Not Specified',
            programName: programName || 'General Banking',
            currentStatus: 'Registered',
            userId: req.user._id,
            clientId: req.user.clientId, // Inherit Bank Selection from User Account
            isActive: true
        });

        await candidate.save();
        res.status(201).json(candidate);
    } catch (e) {
        console.error('Self-Create Profile Error:', e);
        res.status(400).json({ error: 'Failed to create profile' });
    }
});

// Create Candidate (Admin/Support/Agency Admin)
router.post('/', auth, authorize('ADMIN', 'SUB_ADMIN', 'SUPPORT_FIC', 'AGENCY_ADMIN'), upload.single('resume'), async (req, res) => {
    try {
        // Enforce Client ID for Bank Support Users
        if (req.user.role === 'CLIENT_SUPPORT') {
            if (!req.user.clientId) {
                return res.status(403).json({ error: 'No client assigned to your account' });
            }
            req.body.clientId = req.user.clientId;
        }

        // Enforce Agency Admin ownership
        if (req.user.role === 'AGENCY_ADMIN') {
            req.body.createdBy = req.user._id;
            req.body.referredBy = req.user.name;
        }

        // Sanitize clientId
        if (req.body.clientId === '') delete req.body.clientId;

        const candidateData = { ...req.body };

        if (req.file) {
            candidateData.resumeUrl = req.file.path;
            candidateData.resumeOriginalName = req.file.originalname;
        }

        const candidate = new Candidate(candidateData);
        await candidate.save();

        // Sync: Ensure a User account exists for this candidate (for OTP Login)
        // Check by phone or email
        let user = await User.findOne({ $or: [{ phone: candidate.phone }, { email: candidate.email }] });

        if (!user) {
            // Auto-create user
            user = new User({
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                role: 'CANDIDATE',
                password: candidate.phone, // Set password to phone number per requirements
                isActive: true
            });
            await user.save();
        } else {
            // If user exists but has no phone (e.g. created in Users tab), update it
            if (!user.phone && candidate.phone) {
                user.phone = candidate.phone;
                await user.save();
            }
        }

        // Link candidate to user
        if (!candidate.userId || candidate.userId.toString() !== user._id.toString()) {
            candidate.userId = user._id;
            await candidate.save();
        }

        res.status(201).send(candidate);
    } catch (e) {
        console.error('Create Candidate Error:', e);
        if (e.code === 11000) {
            const field = Object.keys(e.keyPattern)[0];
            return res.status(400).json({ error: `Duplicate detected: This ${field} is already registered.` });
        }
        res.status(400).json({
            error: e.message || 'Creation failed',
            details: e
        });
    }
});

// List Candidates with filters
router.get('/', auth, async (req, res) => {
    try {
        let query = {};

        // CLIENT_SUPPORT can only see candidates assigned to their bank
        if (req.user.role === 'CLIENT_SUPPORT') {
            if (!req.user.clientId) {
                return res.status(403).json({ error: 'No client assigned to your account' });
            }
            query.clientId = req.user.clientId;
        } else if (req.user.role === 'CANDIDATE') {
            // CANDIDATE can only see their own record
            // Try by userId first
            let candidates = await Candidate.find({ userId: req.user._id }).populate('clientId').sort({ createdAt: -1 });

            // If not found, try to auto-link by email
            if (candidates.length === 0) {
                const candidateByEmail = await Candidate.findOne({ email: req.user.email });
                if (candidateByEmail) {
                    candidateByEmail.userId = req.user._id;
                    await candidateByEmail.save();
                    await candidateByEmail.populate('clientId');
                    candidates = [candidateByEmail];
                }
            }
            return res.send(candidates);
        }
        // ADMIN and SUPPORT_FIC and SUB_ADMIN can see all candidates

        // Apply additional filters from query params
        if (req.query.status) query.currentStatus = req.query.status;
        if (req.query.clientId && (req.user.role === 'ADMIN' || req.user.role === 'SUB_ADMIN' || req.user.role === 'SUPPORT_FIC' || req.user.role === 'AGENCY_ADMIN')) {
            query.clientId = req.query.clientId;
        }

        const candidates = await Candidate.find(query).populate('clientId').populate('createdBy', 'name _id').sort({ createdAt: -1 });

        // Apply Masking Logic
        const maskedCandidates = candidates.map(c => {
            const candidateObj = c.toObject();
            let shouldMask = false;

            // Rule 1: Client Support (Bank/IT) -> Always Mask
            if (req.user.role === 'CLIENT_SUPPORT') {
                shouldMask = true;
            }

            // Rule 2: Agency Admin -> Mask if NOT created by them
            if (req.user.role === 'AGENCY_ADMIN') {
                const isCreator = c.createdBy && c.createdBy._id.toString() === req.user._id.toString();
                if (!isCreator) {
                    shouldMask = true;
                }
            }

            if (shouldMask && c.phone) {
                // Mask all but last 4 digits
                candidateObj.phone = 'xxxxxx' + c.phone.slice(-4);
            }

            // Generate Signed URL for Resume if publicId exists
            if (candidateObj.resumePublicId) {
                const isRaw = candidateObj.resumeUrl && candidateObj.resumeUrl.includes('/raw/');
                candidateObj.resumeUrl = cloudinary.url(candidateObj.resumePublicId, {
                    resource_type: isRaw ? 'raw' : 'image',
                    type: isRaw ? 'authenticated' : 'upload',
                    sign_url: true,
                    secure: true
                });
            }

            return candidateObj;
        });

        res.json(maskedCandidates);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Status + History
router.patch('/:id/status', auth, authorize('ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT', 'AGENCY_ADMIN'), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).send();

        const oldStatus = candidate.currentStatus;
        const { newStatus, remark } = req.body;

        candidate.currentStatus = newStatus;
        candidate.statusHistory.push({
            oldStatus,
            newStatus,
            remark,
            updatedBy: req.user._id
        });

        // Agency Admin check: Can they update status? The req says "edit only their candidate". 
        // Assuming status update is part of "editing".
        if (req.user.role === 'AGENCY_ADMIN') {
            if (candidate.createdBy && candidate.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'You can only update candidates you referred.' });
            }
            // If legacy candidate (no createdBy), restrict or allow? Safest to restrict.
            if (!candidate.createdBy) {
                return res.status(403).json({ error: 'You cannot update this candidate.' });
            }
        }

        await candidate.save();
        res.send(candidate);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get Candidate Details
router.get('/:id', auth, async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id).populate('clientId userId');
        if (!candidate) return res.status(404).send();

        // Mask phone for bank support
        if (req.user.role === 'CLIENT_SUPPORT') {
            const masked = {
                ...candidate.toObject(),
                phone: maskPhone(candidate.phone)
            };
            return res.send(masked);
        }

        res.send(candidate);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Convert Lead to Candidate
router.post('/from-lead/:leadId', auth, authorize('ADMIN', 'SUPPORT_FIC'), async (req, res) => {
    try {
        const Lead = require('../models/Lead');
        const lead = await Lead.findById(req.params.leadId);
        if (!lead) return res.status(404).send({ error: 'Lead not found' });

        const { clientId, programName } = req.body;

        const candidate = new Candidate({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            location: lead.location,
            clientId: clientId || lead.clientId,
            programName: programName,
            currentStatus: 'Registered'
        });

        await candidate.save();

        // Sync: Ensure a User account exists for this candidate (for OTP Login)
        let user = await User.findOne({ $or: [{ phone: candidate.phone }, { email: candidate.email }] });

        if (!user) {
            // Auto-create user
            user = new User({
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                role: 'CANDIDATE',
                password: Math.random().toString(36).slice(-8), // Random password
                isActive: true
            });
            await user.save();
        }

        // Link candidate to user
        candidate.userId = user._id;
        await candidate.save();

        lead.stage = 'Converted';
        await lead.save();

        res.status(201).send(candidate);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Update Interview Details
router.patch('/:id/interview', auth, authorize('ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'), async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(req.params.id, {
            interview: req.body,
            currentStatus: 'Interview Scheduled'
        }, { new: true });

        candidate.statusHistory.push({
            oldStatus: candidate.currentStatus,
            newStatus: 'Interview Scheduled',
            remark: 'Interview scheduled via dashboard',
            updatedBy: req.user._id
        });
        await candidate.save();

        res.send(candidate);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Update Candidate (General)
router.patch('/:id', auth, authorize('ADMIN', 'SUPPORT_FIC', 'AGENCY_ADMIN'), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).send();

        // Agency Admin check
        if (req.user.role === 'AGENCY_ADMIN') {
            if (!candidate.createdBy || candidate.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'You can only edit candidates you referred.' });
            }
        }

        const updated = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.send(updated);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Upload Document
router.post('/:id/documents', auth, upload.single('document'), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).send();

        if (!req.file) return res.status(400).send({ error: 'No file uploaded' });

        candidate.documents.push({
            name: req.body.name || req.file.originalname,
            url: req.file.path, // Save Cloudinary URL directly
            public_id: req.file.filename // Save public_id for deletion
        });

        await candidate.save();
        res.status(201).send(candidate);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Delete Document
router.delete('/:id/documents/:docId', auth, async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).send();

        const doc = candidate.documents.id(req.params.docId);
        if (!doc) return res.status(404).send({ error: 'Document not found' });

        // Delete from Cloudinary if public_id exists
        if (doc.public_id) {
            try {
                // Determine resource type based on file extension or metadata if possible
                // For now, try 'image' then 'raw' if needed, or rely on cloudinary detecting it?
                // Actually, our upload config sets resource_type.
                // We'll try to delete. 'raw' covers PDFs/Docs usually.
                // Let's guess based on URL extension?
                let resourceType = 'image';
                if (doc.url.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/i)) resourceType = 'raw';

                await cloudinary.uploader.destroy(doc.public_id, { resource_type: resourceType });
            } catch (err) {
                console.error('Failed to delete file from Cloudinary:', err);
            }
        }

        // Remove from array
        candidate.documents.pull(req.params.docId);
        await candidate.save();

        res.send(candidate);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

// Toggle candidate active status (Admin only)
router.patch('/:id/toggle-status', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        candidate.isActive = !candidate.isActive;
        await candidate.save();

        res.json({
            message: `Candidate access ${candidate.isActive ? 'enabled' : 'disabled'} successfully`,
            candidate: { _id: candidate._id, name: candidate.name, isActive: candidate.isActive }
        });
    } catch (e) {
        res.status(400).json({ error: 'Failed to update candidate status' });
    }
});

// Sync User for Candidate (Fix Login)
router.post('/:id/sync-user', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).send({ error: 'Candidate not found' });

        // Check if user exists
        let user = await User.findOne({ $or: [{ phone: candidate.phone }, { email: candidate.email }] });

        if (!user) {
            user = new User({
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                role: 'CANDIDATE',
                password: candidate.phone, // Set password to phone number

                isActive: true
            });
            await user.save();
        }

        // Link
        candidate.userId = user._id;
        await candidate.save();

        res.send({ message: 'User synced', user });
    } catch (e) {
        res.status(500).send(e);
    }
});

// Delete Candidate
router.delete('/:id', auth, authorize('ADMIN', 'AGENCY_ADMIN'), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).send({ error: 'Candidate not found' });

        // Agency Admin check
        if (req.user.role === 'AGENCY_ADMIN') {
            if (!candidate.createdBy || candidate.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'You can only delete candidates you referred.' });
            }
        }

        await Candidate.findByIdAndDelete(req.params.id);

        // Optionally delete linked User
        if (candidate.userId) {
            try {
                await User.findByIdAndDelete(candidate.userId);
            } catch (userErr) {
                console.error('Failed to delete linked user:', userErr);
            }
        }

        res.send(candidate);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
