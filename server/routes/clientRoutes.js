const express = require('express');
const Client = require('../models/Client');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public List of Clients (for Registration)
router.get('/public-list', async (req, res) => {
    try {
        const clients = await Client.find({ isActive: true }).select('name _id').sort({ name: 1 });
        res.json(clients);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch bank list' });
    }
});

// List Clients
router.get('/', auth, async (req, res) => {
    try {
        // If SUB_ADMIN, maybe we should restrict? But for now let them see list to avoid creating duplicates.
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Create Client
router.post('/', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const { name, pocName, pocEmail, pocPhone, password, type } = req.body;
        if (!name) return res.status(400).json({ error: 'Client name is required' });

        const client = new Client({ name, pocName, pocEmail, pocPhone, type: type || 'BANKING' });
        await client.save();

        // Auto-create User for Bank POC
        if (pocEmail && password && pocPhone) {
            const user = new User({
                name: pocName || name,
                email: pocEmail,
                phone: pocPhone,
                role: 'CLIENT_SUPPORT',
                password: password,
                clientId: client._id,
                isActive: true
            });
            await user.save();
        }

        res.status(201).json(client);
    } catch (e) {
        console.error('Client creation error:', e);
        res.status(400).json({ error: e.message || 'Failed to create client' });
    }
});

// Update Client
router.patch('/:id', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const { password, name, pocName, pocEmail, pocPhone, type } = req.body;

        // 1. Update Client
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!client) return res.status(404).json({ error: 'Client not found' });

        // 2. Sync or Create User (if password provided or just to sync details)
        // We look for the main POC user associated with this client
        let user = await User.findOne({ clientId: client._id, role: 'CLIENT_SUPPORT' });

        if (user) {
            // Update existing user details to match Client POC
            if (pocName) user.name = pocName;
            if (pocEmail) user.email = pocEmail;
            if (pocPhone) user.phone = pocPhone;
            if (password) user.password = password; // Will be hashed by pre-save hook

            // If the client type changed to BOTH/IT, we might strictly want to ensure they have access, 
            // but role is 'CLIENT_SUPPORT' regardless. Access is controlled by client.type.

            await user.save();
        } else if (password && pocPhone) {
            // Create missing user (Orphaned client fix)
            user = new User({
                name: pocName || name,
                email: pocEmail, // Optional
                phone: pocPhone,
                role: 'CLIENT_SUPPORT',
                password: password,
                clientId: client._id,
                isActive: true
            });
            await user.save();
        }

        res.json(client);
    } catch (e) {
        console.error("Update client error:", e);
        res.status(400).json({ error: e.message || 'Failed to update client' });
    }
});

// Delete Client
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ message: 'Client deleted successfully' });
    } catch (e) {
        res.status(400).json({ error: 'Failed to delete client' });
    }
});

// Toggle client active status (Admin only)
router.patch('/:id/toggle-status', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });

        client.isActive = !client.isActive;
        await client.save();

        res.json({
            message: `Bank partner ${client.isActive ? 'activated' : 'deactivated'} successfully`,
            client: { _id: client._id, name: client.name, isActive: client.isActive }
        });
    } catch (e) {
        res.status(400).json({ error: 'Failed to update client status' });
    }
});

module.exports = router;
