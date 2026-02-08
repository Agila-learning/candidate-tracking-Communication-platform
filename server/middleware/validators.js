const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return password && password.length >= 8;
};

const validateRole = (role) => {
    const validRoles = ['ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT', 'CANDIDATE'];
    return validRoles.includes(role);
};

const validateRegistration = (req, res, next) => {
    const { name, email, phone, password, role } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number (10 digits starting with 6-9)' });
    }

    if (email && !validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (role && !validateRole(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
        return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    if (email && !validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number' });
    }

    next();
};

const validateCandidate = (req, res, next) => {
    const { name, email, phone } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits starting with 6-9' });
    }

    next();
};

const validateLead = (req, res, next) => {
    const { name, phone } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!phone || !validatePhone(phone)) {
        return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateCandidate,
    validateLead,
    validateEmail,
    validatePhone,
    validatePassword,
    validateRole
};
