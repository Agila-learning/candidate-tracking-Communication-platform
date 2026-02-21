import { useState } from 'react';
import axios from 'axios';
import { config } from '../config';

const ClientRequestPortal = () => {
    const [formData, setFormData] = useState({
        companyName: '', contactName: '', contactEmail: '',
        contactPhone: '', roleType: '', headcount: 1, description: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(config.endpoints.clientRequests.list, formData);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
            <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', maxWidth: '480px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>Request Submitted!</h2>
                <p style={{ color: '#64748b', lineHeight: 1.6 }}>
                    Thank you! Our team will review your staffing request and contact you at <strong>{formData.contactEmail}</strong> within 1–2 business days.
                </p>
                <button onClick={() => { setSubmitted(false); setFormData({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', roleType: '', headcount: 1, description: '' }); }}
                    style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    Submit Another
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
            {/* Left Brand Panel */}
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', color: 'white', position: 'relative', overflow: 'hidden' }} className="brand-panel">
                <style>{`.brand-panel { display: flex; } @media(max-width:900px){ .brand-panel { display: none !important; } .rq-form-side { width: 100% !important; padding: 2rem !important; } }`}</style>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '1rem' }}>FIC CAREER PORTAL</div>
                    <h1 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem' }}>Request Staffing<br />Services</h1>
                    <p style={{ fontSize: '1rem', opacity: 0.85, lineHeight: 1.8 }}>
                        Tell us about your company's hiring needs. We'll match you with the right talent from our candidate pool — vetted, trained, and ready.
                    </p>
                    <div style={{ marginTop: '3rem', display: 'grid', gap: '1rem' }}>
                        {[['🏦', 'Banking Operations'], ['💻', 'IT & Tech Support'], ['📊', 'Back Office / Admin'], ['🤝', 'Customer Relations']].map(([icon, role]) => (
                            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.9, fontSize: '0.9rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{icon}</span> {role}
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Right Form Panel */}
            <div className="rq-form-side" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: '4rem' }}>
                <div style={{ width: '100%', maxWidth: '460px' }}>
                    <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Staffing Request</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Fill in your details and we'll get back to you.</p>
                    </div>

                    {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Company Name *</label>
                                <input required placeholder="e.g. Axis Bank" value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Contact Person</label>
                                <input placeholder="Your name" value={formData.contactName}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Email Address *</label>
                                <input required type="email" placeholder="you@company.com" value={formData.contactEmail}
                                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Phone (Optional)</label>
                                <input type="tel" placeholder="9876543210" value={formData.contactPhone}
                                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Role / Position Needed *</label>
                                <select required value={formData.roleType} onChange={e => setFormData({ ...formData, roleType: e.target.value })}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}>
                                    <option value="">-- Select Role --</option>
                                    <option>Banking Operations</option>
                                    <option>IT Support / Developer</option>
                                    <option>Customer Relations</option>
                                    <option>Back Office / Admin</option>
                                    <option>Sales Executive</option>
                                    <option>Data Entry Operator</option>
                                    <option>Other / Multiple Roles</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Headcount *</label>
                                <input required type="number" min="1" value={formData.headcount}
                                    onChange={e => setFormData({ ...formData, headcount: parseInt(e.target.value) || 1 })}
                                    style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Additional Requirements</label>
                            <textarea placeholder="Describe skills, qualifications, location preferences, etc." value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical' }} />
                        </div>

                        <button type="submit" disabled={loading}
                            style={{ padding: '0.9rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                            {loading ? 'Submitting...' : 'Submit Staffing Request →'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                            Already have an account? <a href="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign In</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClientRequestPortal;
