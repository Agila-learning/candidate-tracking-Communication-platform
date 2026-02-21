import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

/* ─── Floating animated blob ─────────────────────────────────── */
const Blob = ({ top, left, size, color, delay }) => (
    <div style={{
        position: 'absolute', top, left,
        width: size, height: size, borderRadius: '50%',
        background: color, filter: 'blur(60px)', opacity: 0.35,
        animation: `blobFloat 6s ease-in-out ${delay} infinite alternate`,
        pointerEvents: 'none'
    }} />
);

/* ─── Animated counter stat ──────────────────────────────────── */
const Stat = ({ icon, value, label }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '0.1rem' }}>{icon}</div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{value}</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7, lineHeight: 1.2 }}>{label}</div>
    </div>
);

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
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
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <style>{`
                @keyframes blobFloat {
                    0%   { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(30px, -30px) scale(1.12); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmerLine {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes pulse-ring {
                    0%   { transform: scale(1); opacity: 0.4; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                .logo-card {
                    background: white;
                    border-radius: 18px;
                    padding: 1.25rem 1.5rem;
                    display: inline-block;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    margin-bottom: 2rem;
                    backdrop-filter: blur(4px);
                }
                .login-brand-side { animation: fadeUp 0.7s ease both; }
                .login-form-side  { animation: fadeUp 0.7s 0.15s ease both; }
                @media (max-width: 900px) {
                    .login-brand-side { display: none !important; }
                    .login-form-side  { width: 100% !important; padding: 2rem !important; }
                }
                .modern-input {
                    width: 100%; padding: 0.78rem 1rem; border-radius: 10px;
                    border: 1.5px solid #e2e8f0; font-size: 1rem;
                    background: white; color: #1e293b;
                    box-sizing: border-box; transition: border 0.18s, box-shadow 0.18s;
                }
                .modern-input:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
                    outline: none;
                }
                .signin-btn {
                    width: 100%; padding: 0.9rem; border: none; border-radius: 10px;
                    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                    color: white; font-weight: 700; font-size: 1rem;
                    cursor: pointer; transition: all 0.22s;
                    box-shadow: 0 4px 14px rgba(59,130,246,0.3);
                }
                .signin-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59,130,246,0.4);
                }
                .signin-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .request-cta {
                    display: block; width: 100%; box-sizing: border-box;
                    padding: 0.9rem 1.25rem;
                    background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
                    color: white; text-decoration: none; border-radius: 12px;
                    font-weight: 700; font-size: 0.95rem; text-align: center;
                    box-shadow: 0 4px 14px rgba(249,115,22,0.25);
                    transition: all 0.25s; letter-spacing: 0.01em;
                }
                .request-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(249,115,22,0.35);
                }
                .feature-chip {
                    display: flex; align-items: center; gap: 0.6rem;
                    font-size: 0.88rem; opacity: 0; border-radius: 40px;
                    animation: fadeUp 0.5s ease forwards;
                }
            `}</style>

            {/* ══════════ LEFT — Brand Panel ══════════ */}
            <div className="login-brand-side" style={{
                flex: 1, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '4rem', color: 'white'
            }}>
                {/* Animated blobs */}
                <Blob top="5%" left="60%" size="300px" color="#3b82f6" delay="0s" />
                <Blob top="55%" left="-5%" size="250px" color="#8b5cf6" delay="1s" />
                <Blob top="70%" left="60%" size="200px" color="#06b6d4" delay="2s" />

                {/* Forge India Logo on white card */}
                <div className="logo-card">
                    <img
                        src="/logo.jpg"
                        alt="Forge India Connect"
                        style={{ width: '220px', height: 'auto', display: 'block' }}
                    />
                </div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                        FIC Career<br />Portal
                    </h1>
                    <p style={{ fontSize: '1.05rem', opacity: 0.8, maxWidth: '380px', lineHeight: 1.65, marginBottom: '2.5rem' }}>
                        India's advanced platform for banking careers, candidate management, and partner relationships.
                    </p>

                    {/* Feature chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2.5rem' }}>
                        {[
                            { icon: '🏦', text: 'Banking & Tech Partner Dashboards', delay: '0.3s' },
                            { icon: '🎓', text: 'Candidate Tracking & Interview Pipeline', delay: '0.45s' },
                            { icon: '📊', text: 'Real-time Analytics & Reports', delay: '0.6s' },
                            { icon: '💬', text: 'Integrated Chat, Inbox & Announcements', delay: '0.75s' },
                        ].map(f => (
                            <div key={f.icon} className="feature-chip" style={{ animationDelay: f.delay, animationFillMode: 'forwards' }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>{f.icon}</div>
                                <span>{f.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats strip */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                        gap: '0.5rem', background: 'rgba(255,255,255,0.08)',
                        borderRadius: '14px', padding: '1.25rem 1rem',
                        backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)'
                    }}>
                        <Stat icon="🏢" value="50+" label="Partner Banks" />
                        <Stat icon="🎓" value="2K+" label="Candidates" />
                        <Stat icon="✅" value="500+" label="Placements" />
                    </div>
                </div>
            </div>

            {/* ══════════ RIGHT — Login Form ══════════ */}
            <div className="login-form-side" style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                background: '#f8fafc', padding: '4rem', position: 'relative', overflowY: 'auto'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', margin: '0 auto 1rem', boxShadow: '0 4px 16px rgba(59,130,246,0.3)'
                        }}>🔐</div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>Welcome Back</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Sign in with your admin-assigned credentials</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {/* Email / Phone field */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                                Email or Mobile Number
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>📧</span>
                                <input
                                    className="modern-input"
                                    type="text"
                                    placeholder="you@example.com or 9876543210"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div style={{ marginBottom: '1.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔒</span>
                                <input
                                    className="modern-input"
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.5 }}>
                                    {showPw ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="signin-btn" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white', borderRadius: '50%',
                                        animation: 'blobFloat 0.7s linear infinite'
                                    }} />
                                    Signing In...
                                </span>
                            ) : 'Sign In →'}
                        </button>

                        {loading && (
                            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                                Connecting to server... (may take ~60s on first load if server is sleeping)
                            </p>
                        )}
                    </form>

                    {/* Divider */}
                    <div style={{ margin: '1.75rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Are you a company looking to hire?</span>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    </div>

                    {/* Client CTA — prominent orange banner */}
                    <a href="/request-services" className="request-cta">
                        🏢 Request Staffing Services
                        <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.9, marginTop: '0.2rem' }}>
                            Companies can request banking / tech talent sourcing
                        </div>
                    </a>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
                        © 2026 FIC Career Portal · v2.5<br />
                        All accounts are created and managed by administrators
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
