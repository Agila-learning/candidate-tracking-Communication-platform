const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP } = require('../services/otpService');
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validators');

const router = express.Router();

// Public Signup - DISABLED: All accounts are created by Admin only
// Preventing unauthorized self-registration
router.post('/signup', async (req, res) => {
    return res.status(403).json({
        error: 'Self-registration is not allowed. Please contact your administrator to create an account, or request staffing services at /request-services.'
    });
});


// Admin Register - Protected endpoint (only admins can create users manually)
router.post('/register', auth, validateRegistration, async (req, res) => {
    try {
        // Only ADMIN can create new users manually via this route
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only administrators can create new users' });
        }

        // ... (rest of the logic remains generally same but let's just keep the existing logic flow if possible or rewrite it cleaner)
        const { name, email, phone, password, role, clientId } = req.body;

        // Check duplicates
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });
        }
        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) return res.status(400).json({ error: 'User with this phone number already exists' });
        }

        const user = new User({ name, email, phone, password, role: role || 'CANDIDATE', clientId });
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
        res.status(400).json({ error: 'Failed to create user.' });
    }
});

// Login - accepts email or phone via single `identifier` field OR separate email/phone fields
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { identifier, email, phone, password } = req.body;

        // Resolve identifier: could be a single string that is email or phone
        const loginId = identifier || email || phone;

        let user;
        if (loginId && loginId.includes('@')) {
            // Looks like email
            user = await User.findOne({ email: loginId }).populate('clientId');
        } else if (loginId && /^\d{10}$/.test(loginId)) {
            // Looks like a 10-digit phone
            user = await User.findOne({ phone: loginId }).populate('clientId');
        } else {
            // Try email first, then phone
            user = await User.findOne({ email: loginId }).populate('clientId');
            if (!user) user = await User.findOne({ phone: loginId }).populate('clientId');
        }

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user account is active
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Your account has been disabled. Please contact administrator for assistance.'
            });
        }

        // --- NEW: Restrict Candidate Login based on Status ---
        if (user.role === 'CANDIDATE') {
            const Candidate = require('../models/Candidate');
            const candidateInfo = await Candidate.findOne({ userId: user._id });

            if (candidateInfo) {
                const allowedStatuses = [
                    'Shortlisted', 'Training In Progress', 'Training Completed',
                    'Interview Scheduled', 'Interview Attended', 'Interview Cleared',
                    'Offer Released', 'Joining Confirmed', 'Joined'
                ];

                if (!allowedStatuses.includes(candidateInfo.currentStatus)) {
                    return res.status(403).json({
                        error: `Your application is currently '${candidateInfo.currentStatus}'. You will be granted login access once you are Shortlisted.`
                    });
                }
            }
        }
        // -----------------------------------------------------

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
        res.status(500).json({ error: 'Login failed', details: e.message });
    }
});

// Send OTP (Simulation Mode)
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        // Basic validation
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ error: 'Phone number not registered. Please contact your Admin/Bank.' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP via Service
        await sendOTP(phone, otp);

        // DEV ONLY: Return OTP in response for testing
        res.json({ message: 'OTP sent successfully', debugOtp: otp });
    } catch (e) {
        console.error('OTP Send Error:', e);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const user = await User.findOne({ phone }).populate('clientId');

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful login
        user.otp = undefined;
        user.otpExpires = undefined;
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                clientId: user.clientId
            },
            token
        });
    } catch (e) {
        console.error('OTP Verify Error:', e);
        res.status(500).json({ error: 'Verification failed' });
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
