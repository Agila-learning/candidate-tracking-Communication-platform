const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { auth, authorize } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validators');

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('clientId').sort({ createdAt: -1 });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create user (Admin only)
router.post('/', auth, authorize('ADMIN'), validateRegistration, async (req, res) => {
    try {
        const { name, email, phone, password, role, clientId } = req.body;

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ error: 'Email already exists' });
        }

        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) return res.status(400).json({ error: 'Phone number already exists' });
        }

        if (role === 'CLIENT_SUPPORT' && !clientId) {
            return res.status(400).json({ error: 'Client ID required for bank support users' });
        }

        const userPassword = password || phone; // Default to mobile number
        const user = new User({ name, email, phone, password: userPassword, role, clientId });
        await user.save();

        // Auto-link candidate profile if exists
        if (role === 'CANDIDATE') {
            const Candidate = require('../models/Candidate');
            const candidate = await Candidate.findOne({ email });
            if (candidate) {
                candidate.userId = user._id;
                await candidate.save();

                // Inherit client assignment from candidate if user has none
                if (!clientId && candidate.clientId) {
                    user.clientId = candidate.clientId;
                    await user.save();
                }
            }
        }

        res.status(201).json({
            message: 'User created successfully',
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (e) {
        res.status(400).json({ error: 'Failed to create user' });
    }
});

// Update user (Admin only)
router.patch('/:id', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const { password, ...updates } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Apply field updates
        Object.assign(user, updates);

        // Handle password update
        if (password && password.trim()) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password.trim(), salt);
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');
        res.json(updatedUser);
    } catch (e) {
        console.error('Update user error:', e);
        res.status(400).json({ error: 'Failed to update user' });
    }
});

// Delete user (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role === 'ADMIN') {
            const adminCount = await User.countDocuments({ role: 'ADMIN' });
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the only admin' });
            }
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (e) {
        res.status(400).json({ error: 'Failed to delete user' });
    }
});

// Toggle user active status (Admin only)
router.patch('/:id/toggle-status', auth, authorize('ADMIN'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Prevent disabling all admins
        if (user.role === 'ADMIN' && user.isActive) {
            const activeAdminCount = await User.countDocuments({ role: 'ADMIN', isActive: true });
            if (activeAdminCount <= 1) {
                return res.status(400).json({ error: 'Cannot disable the only active admin' });
            }
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully`,
            user: { _id: user._id, name: user.name, email: user.email, isActive: user.isActive }
        });
    } catch (e) {
        res.status(400).json({ error: 'Failed to update user status' });
    }
});

module.exports = router;
