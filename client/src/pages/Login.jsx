import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!identifier) return showToast('Please enter your email or mobile number', 'error');
        if (!password) return showToast('Please enter your password', 'error');

        setLoading(true);
        try {
            const user = await login(identifier.trim(), password.trim());
            showToast(`Welcome back, ${user.name}!`);
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
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
                .request-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(249,115,22,0.35) !important;
                }
                .sign-in-btn:hover { background: #1e3a8a !important; }
            `}</style>

            {/* Left Side - Brand */}
            <div className="login-brand-side" style={{
                flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '4rem', color: 'white', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        FIC Career<br />Portal
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px', lineHeight: 1.6 }}>
                        The advanced platform for managing banking careers, candidates, and client relationships efficiently.
                    </p>

                    {/* Access Features List */}
                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { icon: '🏦', text: 'Banking & Tech Partner Dashboards' },
                            { icon: '🎓', text: 'Candidate Tracking & Status' },
                            { icon: '📊', text: 'Real-time Analytics & Reports' },
                            { icon: '💬', text: 'Integrated Chat & Inbox' },
                        ].map(f => (
                            <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', opacity: 0.85 }}>
                                <span>{f.icon}</span><span>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Decorative Circles */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Right Side - Form */}
            <div className="login-form-side" style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', background: '#f8fafc', padding: '4rem', position: 'relative'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: '#64748b' }}>Sign in with your admin-assigned credentials.</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Email or Mobile Number
                            </label>
                            <input
                                className="modern-input"
                                type="text"
                                placeholder="Enter email or mobile number"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Password
                            </label>
                            <input
                                className="modern-input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b', boxSizing: 'border-box' }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="sign-in-btn"
                            style={{ width: '100%', padding: '0.875rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing In...' : 'Sign In →'}
                        </button>

                        {loading && (
                            <p className="fade-in" style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
                                Connecting to server...<br />
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Server may take ~60s to wake up on first load)</span>
                            </p>
                        )}
                    </form>

                    {/* Divider */}
                    <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Are you a company?</span>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    </div>

                    {/* Prominent Client CTA */}
                    <a
                        href="/request-services"
                        className="request-cta"
                        style={{
                            display: 'block', width: '100%', boxSizing: 'border-box',
                            padding: '0.9rem 1.25rem',
                            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                            color: 'white', textDecoration: 'none', borderRadius: '10px',
                            fontWeight: 700, fontSize: '0.95rem', textAlign: 'center',
                            boxShadow: '0 4px 14px rgba(249,115,22,0.25)',
                            transition: 'all 0.25s', letterSpacing: '0.01em'
                        }}
                    >
                        🏢 Request Staffing Services
                        <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.9, marginTop: '0.2rem' }}>
                            For companies looking to hire through FIC
                        </div>
                    </a>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                        © 2026 FIC Career Portal · v2.5 · Accounts are created by your administrator
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
