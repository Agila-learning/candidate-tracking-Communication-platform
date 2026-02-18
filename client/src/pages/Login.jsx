import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
        if (!identifier) return showToast('Please enter your mobile number', 'error');
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
                        FIC Career<br />Portal
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '400px', lineHeight: 1.6 }}>
                        The advanced platform for managing banking careers, candidates, and client relationships efficiently.
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
                position: 'relative'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: '#64748b' }}>Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Mobile Number
                            </label>
                            <input
                                className="modern-input"
                                type="text"
                                placeholder="Enter mobile number"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b' }}
                            />
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                                Password
                            </label>
                            <input
                                className="modern-input"
                                type="password"
                                placeholder="Enter password (or mobile number)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white', color: '#1e293b' }}
                            />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '0.875rem', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }} disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <p style={{ color: '#64748b' }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                                    Create Account
                                </Link>
                            </p>
                        </div>

                        {loading && (
                            <p className="fade-in" style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
                                Connecting to server...<br />
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Server may take ~60s to wake up)</span>
                            </p>
                        )}
                    </form>
                </div>

                {/* Footer fixed at bottom of the form side */}
                <div style={{ position: 'absolute', bottom: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                    &copy; 2026 FIC Career Portal. v2.5.
                </div>
            </div>
        </div>
    );
};

export default Login;
