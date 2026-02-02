const express = require('express');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { validateCandidate } = require('../middleware/validators');
const { maskPhone } = require('../utils/masking');
const upload = require('../middleware/upload');

const router = express.Router();

// Create Candidate
router.post('/', auth, validateCandidate, authorize('ADMIN', 'SUPPORT_FIC'), async (req, res) => {
    try {
        const candidate = new Candidate(req.body);
        await candidate.save();
        res.status(201).send(candidate);
    } catch (e) {
        res.status(400).send(e);
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
        // ADMIN and SUPPORT_FIC can see all candidates

        // Apply additional filters from query params
        if (req.query.status) query.currentStatus = req.query.status;
        if (req.query.clientId && (req.user.role === 'ADMIN' || req.user.role === 'SUPPORT_FIC')) {
            query.clientId = req.query.clientId;
        }

        const candidates = await Candidate.find(query).populate('clientId').sort({ createdAt: -1 });

        // Mask phone for bank support
        if (req.user.role === 'CLIENT_SUPPORT') {
            const masked = candidates.map(c => ({
                ...c.toObject(),
                phone: maskPhone(c.phone)
            }));
            return res.send(masked);
        }

        res.send(candidates);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Status + History
router.patch('/:id/status', auth, authorize('ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'), async (req, res) => {
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

        const candidate = new Candidate({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            location: lead.location,
            clientId: lead.clientId,
            currentStatus: 'Registered'
        });

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
router.patch('/:id', auth, authorize('ADMIN', 'SUPPORT_FIC'), async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!candidate) return res.status(404).send();
        res.send(candidate);
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
            url: `/uploads/${req.file.filename}`
        });

        await candidate.save();
        res.status(201).send(candidate);
    } catch (e) {
        res.status(400).send(e);
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

module.exports = router;
