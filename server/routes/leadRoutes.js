const express = require('express');
const Lead = require('../models/Lead');
const { auth, authorize } = require('../middleware/auth');
const { validateLead } = require('../middleware/validators');

const router = express.Router();

// Create Lead
router.post('/', auth, validateLead, async (req, res) => {
    try {
        const lead = new Lead(req.body);
        await lead.save();
        res.status(201).send(lead);
    } catch (e) {
        res.status(400).send(e);
    }
});

// List Leads
router.get('/', auth, authorize('ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'), async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'CLIENT_SUPPORT') {
            query.clientId = req.user.clientId;
        }

        if (req.query.stage) query.stage = req.query.stage;

        const leads = await Lead.find(query).populate('clientId');
        res.send(leads);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Lead Stage/Info
router.patch('/:id', auth, authorize('ADMIN', 'SUPPORT_FIC'), async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'phone', 'email', 'location', 'stage', 'clientId'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!lead) return res.status(404).send();
        res.send(lead);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;
