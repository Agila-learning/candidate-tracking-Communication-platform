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
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)'
        }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>FIC Connect</h1>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                    Lead & Candidate Tracking System
                </p>

                {/* Toggle Method */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('mobile')}
                        style={{
                            background: loginMethod === 'mobile' ? 'var(--primary)' : 'transparent',
                            color: loginMethod === 'mobile' ? 'white' : 'var(--text-muted)',
                            border: '1px solid var(--primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        Mobile / OTP
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('email')}
                        style={{
                            background: loginMethod === 'email' ? 'var(--primary)' : 'transparent',
                            color: loginMethod === 'email' ? 'white' : 'var(--text-muted)',
                            border: '1px solid var(--primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        Email / Password
                    </button>
                </div>

                {loginMethod === 'mobile' ? (
                    /* Mobile OTP Flow */
                    step === 1 ? (
                        <form onSubmit={handleSendOtp}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mobile Number</label>
                                <input
                                    type="tel"
                                    placeholder="Enter 10 digit number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                                />
                            </div>
                            <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Enter OTP</label>
                                <input
                                    type="text"
                                    placeholder="XXXX"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                                    (Check server console for Simulated OTP)
                                </p>
                            </div>
                            <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ width: '100%', marginTop: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                Change Number
                            </button>
                        </form>
                    )
                ) : (
                    /* Email Flow */
                    <form onSubmit={handleEmailLogin}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
                            <input
                                type="email"
                                placeholder="admin@fic.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
