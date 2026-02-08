const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

export const config = {
    apiUrl: API_URL,
    endpoints: {
        auth: {
            login: `${API_URL}/api/auth/login`,
            signup: `${API_URL}/api/auth/signup`,
            register: `${API_URL}/api/auth/register`,
            me: `${API_URL}/api/auth/me`,
            sendOtp: `${API_URL}/api/auth/send-otp`,
            verifyOtp: `${API_URL}/api/auth/verify-otp`
        },
        users: {
            list: `${API_URL}/api/users`,
            toggleStatus: (id) => `${API_URL}/api/users/${id}/toggle-status`,
            delete: (id) => `${API_URL}/api/users/${id}`
        },
        clients: {
            list: `${API_URL}/api/clients`,
            create: `${API_URL}/api/clients`,
            toggleStatus: (id) => `${API_URL}/api/clients/${id}/toggle-status`,
            delete: (id) => `${API_URL}/api/clients/${id}`
        },
        candidates: {
            list: `${API_URL}/api/candidates`,
            create: `${API_URL}/api/candidates`,
            toggleStatus: (id) => `${API_URL}/api/candidates/${id}/toggle-status`,
            details: (id) => `${API_URL}/api/candidates/${id}`,
            delete: (id) => `${API_URL}/api/candidates/${id}`
        },
        leads: `${API_URL}/api/leads`,
        chat: `${API_URL}/api/chat`,
        resources: `${API_URL}/api/resources`,
        announcements: `${API_URL}/api/announcements`
    }
};

export default config;
