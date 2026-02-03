import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' | 'email'
    const [step, setStep] = useState(1); // 1: Phone Input, 2: OTP Input

    // Mobile State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');

    // Email State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const { login, sendOtp, verifyOtp } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!phone) return showToast('Please enter your mobile number', 'error');

        setLoading(true);
        try {
            await sendOtp(phone);
            showToast(`OTP sent to ${phone}`);
            // Check console for simulated OTP
            console.log('Check server console for OTP');
            setStep(2);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to send OTP';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp) return showToast('Please enter the OTP', 'error');

        setLoading(true);
        try {
            const user = await verifyOtp(phone, otp);
            showToast(`Welcome back, ${user.name}!`);
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Invalid OTP';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(email, password);
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
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(45deg, #1a1c20, #0f172a, #312e81)',
            backgroundSize: '400% 400%',
            animation: 'gradientBG 15s ease infinite',
            padding: '1rem'
        }}>
            <style>{`
                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                }
                .login-input {
                    background: rgba(0, 0, 0, 0.2) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    transition: all 0.3s ease;
                }
                .login-input:focus {
                    background: rgba(0, 0, 0, 0.4) !important;
                    border-color: var(--primary) !important;
                    outline: none;
                }
            `}</style>

            <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '420px', padding: '3rem', borderRadius: '24px', color: 'white' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        width: '60px', height: '60px', margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
                    }}>
                        🚀
                    </div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>FIC Connect</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        Premier Banking Career Portal
                    </p>
                </div>

                {/* Toggle Method */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', marginBottom: '2.5rem' }}>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('mobile')}
                        style={{
                            flex: 1,
                            background: loginMethod === 'mobile' ? 'var(--primary)' : 'transparent',
                            color: loginMethod === 'mobile' ? 'white' : 'rgba(255,255,255,0.6)',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Mobile One-Time Password
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('email')}
                        style={{
                            flex: 1,
                            background: loginMethod === 'email' ? 'var(--primary)' : 'transparent',
                            color: loginMethod === 'email' ? 'white' : 'rgba(255,255,255,0.6)',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Admin Email
                    </button>
                </div>

                {loginMethod === 'mobile' ? (
                    /* Mobile OTP Flow */
                    step === 1 ? (
                        <form onSubmit={handleSendOtp}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Mobile Number</label>
                                <input
                                    className="login-input"
                                    type="tel"
                                    placeholder="Enter 10 digit number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                                />
                            </div>
                            <button type="submit" className="primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px', background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%)', border: 'none' }} disabled={loading}>
                                {loading ? 'Sending...' : 'Send Secure OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Enter Verification Code</label>
                                <input
                                    className="login-input"
                                    type="text"
                                    placeholder="• • • •"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 700 }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', textAlign: 'center' }}>
                                    (Enter the code sent to {phone})
                                </p>
                            </div>
                            <button type="submit" className="primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px', background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%)', border: 'none' }} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ width: '100%', marginTop: '1.5rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Use a different number
                            </button>
                        </form>
                    )
                ) : (
                    /* Email Flow */
                    <form onSubmit={handleEmailLogin}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Email Address</label>
                            <input
                                className="login-input"
                                type="email"
                                placeholder="name@fic-banking.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Password</label>
                            <input
                                className="login-input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                            />
                        </div>
                        <button type="submit" className="primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px', background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%)', border: 'none' }} disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                )}
            </div>

            <div style={{ position: 'absolute', bottom: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                © 2026 FIC Banking Connect. Secure Transaction System.
            </div>
        </div>
    );
};

export default Login;
