import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import { config } from '../config';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'CANDIDATE', // Default role
        clientId: ''
    });

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await axios.get(`${config.apiUrl}/api/clients/public-list`);
                setClients(res.data);
            } catch (e) {
                console.error('Failed to fetch banks', e);
            }
        };
        fetchClients();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Basic Client-Side Validation
        if (!formData.name || !formData.password || !formData.phone) {
            return showToast('Please fill in Name, Phone, and Password', 'error');
        }

        if (formData.role === 'CLIENT_SUPPORT' && !formData.clientId) {
            return showToast('Please select your Bank Partner', 'error');
        }

        setLoading(true);
        try {
            // Send only non-empty fields to backend to avoid empty string validation issues
            const payload = { ...formData };
            if (!payload.email) delete payload.email;
            if (payload.role !== 'CLIENT_SUPPORT') delete payload.clientId;

            const user = await signup(payload);
            showToast(`Welcome, ${user.user.name}! Account created successfully.`);
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
            {/* Left Side - Brand/Image */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '4rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }} className="login-brand-side">
                <style>{`
                    @media (max-width: 900px) {
                        .login-brand-side { display: none !important; }
                        .login-form-side { width: 100% !important; padding: 2rem !important; }
                    }
                    .modern-input:focus {
                        border-color: #3b82f6 !important;
                        box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
                        outline: none;
                    }
                `}</style>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        Join FIC Banking<br />Connect
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px', lineHeight: 1.6 }}>
                        Start your journey with the advanced platform for managing banking careers.
                    </p>
                </div>
                {/* Decorative Circles */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Right Side - Form */}
            <div className="login-form-side" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '4rem',
                position: 'relative',
                overflowY: 'auto'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Create Account</h2>
                        <p style={{ color: '#64748b' }}>Sign up to get started.</p>
                    </div>

                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Full Name <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                className="modern-input"
                                type="text"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Email Address <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
                            </label>
                            <input
                                className="modern-input"
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Mobile Number <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                className="modern-input"
                                type="tel"
                                name="phone"
                                placeholder="10 digit number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Password <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                className="modern-input"
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b' }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                I am a... <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="modern-input"
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b', cursor: 'pointer' }}
                            >
                                <option value="CANDIDATE">Candidate (Job Seeker)</option>
                                <option value="CLIENT_SUPPORT">Bank/Client Partner</option>
                            </select>
                        </div>

                        {formData.role === 'CLIENT_SUPPORT' && (
                            <div style={{ marginBottom: '2rem' }} className="fade-in">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                    Select Your Bank <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    className="modern-input"
                                    required
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b', cursor: 'pointer' }}
                                >
                                    <option value="">-- Choose Bank --</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button type="submit" style={{ width: '100%', padding: '0.875rem', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <p style={{ color: '#64748b' }}>
                                Already have an account?{' '}
                                <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer fixed at bottom of the form side */}
                <div style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center' }}>
                    &copy; 2026 FIC Banking Connect. v2.5.
                </div>
            </div>
        </div>
    );
};

export default Register;
