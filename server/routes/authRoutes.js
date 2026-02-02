const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validators');

const router = express.Router();

// Register - Protected endpoint (only admins can create users)
router.post('/register', auth, validateRegistration, async (req, res) => {
    try {
        // Only ADMIN can create new users
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only administrators can create new users' });
        }

        const { name, email, password, role, clientId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Validate role-specific requirements
        if (role === 'CLIENT_SUPPORT' && !clientId) {
            return res.status(400).json({ error: 'Client ID is required for CLIENT_SUPPORT role' });
        }

        const user = new User({ name, email, password, role: role || 'CANDIDATE', clientId });
        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(400).json({ error: 'Failed to create user. Please check all required fields.' });
    }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('clientId');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user account is active
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Your account has been disabled. Please contact administrator for assistance.'
            });
        }

        // Check if assigned client is active (for CLIENT_SUPPORT users)
        if (user.role === 'CLIENT_SUPPORT' && user.clientId && !user.clientId.isActive) {
            return res.status(403).json({
                error: 'Your assigned bank partner is currently inactive. Please contact administrator.'
            });
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                clientId: user.clientId
            },
            token
        });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('clientId');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (e) {
        console.error('Get user error:', e);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

module.exports = router;
