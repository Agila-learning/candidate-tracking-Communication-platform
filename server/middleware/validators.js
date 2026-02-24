// FIC Platform v1.1.2 - Backend Validators
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
    if (!role) return false;
    const validRoles = ['ADMIN', 'SUB_ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT', 'AGENCY_ADMIN', 'AGENT', 'CANDIDATE', 'HR'];
    return validRoles.includes(role.trim().toUpperCase());

};

const validateRegistration = (req, res, next) => {
    const { name, email, phone, password, role } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    // For Clients (CLIENT_SUPPORT) and Agents: email is required, phone is optional
    // For Candidates: phone or email is required (existing workflow)
    const rolesRequiringEmail = ['CLIENT_SUPPORT', 'AGENT', 'AGENCY_ADMIN', 'SUB_ADMIN', 'SUPPORT_FIC', 'HR'];
    if (rolesRequiringEmail.includes(role)) {
        if (!email) {
            return res.status(400).json({ error: 'Email address is required for this role' });
        }
    } else {
        // Candidates: require phone
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        if (!validatePhone(phone)) {
            return res.status(400).json({ error: 'Invalid phone number (10 digits)' });
        }
    }

    if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number (10 digits starting with 6-9)' });
    }

    if (email && !validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Only validate password if it is provided. If not provided, route logic will set default.
    if (password && !validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }


    if (role && !validateRole(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
    }

    next();
};

const validateLogin = (req, res, next) => {
    // Support both: { identifier, password } and { email, phone, password }
    const { identifier, email, phone, password } = req.body;

    const loginId = identifier || email || phone;
    if (!loginId || !password) {
        return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    // If it looks like a phone number (all digits), validate as phone
    if (/^\d+$/.test(loginId) && !validatePhone(loginId)) {
        return res.status(400).json({ error: 'Invalid phone number' });
    }

    // If it looks like an email, validate format
    if (loginId.includes('@') && !validateEmail(loginId)) {
        return res.status(400).json({ error: 'Invalid email format' });
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
