import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state
    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading to true when submission starts
        try {
            const user = await login(email, password);
            showToast(`Welcome back, ${user.name}!`);
            navigate('/'); // Retained navigation on success
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
            showToast(errorMsg, 'error');
            console.error('Login error:', err);
        } finally {
            setLoading(false); // Set loading to false when submission finishes
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


                <form onSubmit={handleSubmit}>
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
                    <button type="submit" className="primary" style={{ width: '100%' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
