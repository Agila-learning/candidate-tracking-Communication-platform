const express = require('express');
const ClientRequest = require('../models/ClientRequest');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public: Submit a client staffing request (no auth needed - anyone can request)
router.post('/', async (req, res) => {
    try {
        const { companyName, contactName, contactEmail, contactPhone, roleType, headcount, description } = req.body;

        if (!companyName || !contactEmail || !roleType) {
            return res.status(400).json({ error: 'Company name, contact email, and role type are required' });
        }

        const request = new ClientRequest({
            companyName,
            contactName,
            contactEmail,
            contactPhone,
            roleType,
            headcount: headcount || 1,
            description,
            status: 'PENDING'
        });

        await request.save();
        res.status(201).json({ message: 'Request submitted successfully. Our team will contact you shortly.', request });
    } catch (e) {
        console.error('Client request error:', e);
        res.status(400).json({ error: e.message || 'Failed to submit request' });
    }
});

// Admin: Get all client requests
router.get('/', auth, authorize('ADMIN', 'SUB_ADMIN'), async (req, res) => {
    try {
        const requests = await ClientRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Admin: Get pending count (for notification badge)
router.get('/pending-count', auth, authorize('ADMIN', 'SUB_ADMIN'), async (req, res) => {
    try {
        const count = await ClientRequest.countDocuments({ status: 'PENDING' });
        res.json({ count });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch count' });
    }
});

// Admin: Update request status
router.patch('/:id', auth, authorize('ADMIN', 'SUB_ADMIN'), async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const request = await ClientRequest.findByIdAndUpdate(
            req.params.id,
            { status, adminNotes, updatedAt: new Date() },
            { new: true }
        );
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (e) {
        res.status(400).json({ error: 'Failed to update request' });
    }
});

// Admin: Delete a request
router.delete('/:id', auth, authorize('ADMIN', 'SUB_ADMIN'), async (req, res) => {
    try {
        await ClientRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Request deleted' });
    } catch (e) {
        res.status(400).json({ error: 'Failed to delete request' });
    }
});

module.exports = router;
