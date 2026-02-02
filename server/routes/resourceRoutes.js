const express = require('express');
const Resource = require('../models/Resource');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all resources (accessible by everyone authenticated)
router.get('/', auth, async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.send(resources);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Create a resource (Admin only)
router.post('/', auth, authorize('ADMIN', 'SUPPORT_FIC'), async (req, res) => {
    try {
        const resource = new Resource({
            ...req.body,
            postedBy: req.user._id
        });
        await resource.save();
        res.status(201).send(resource);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Delete a resource
router.delete('/:id', auth, authorize('ADMIN', 'SUPPORT_FIC'), async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) return res.status(404).send();
        res.send(resource);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
