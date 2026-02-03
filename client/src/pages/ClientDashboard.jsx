import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import SupportInbox from '../components/SupportInbox';
import Resources from '../components/Resources';
import CandidateDetail from '../components/CandidateDetail';
import Announcements from '../components/Announcements';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';

const ClientDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('candidates');
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Add Candidate State
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', programName: '', qualification: 'Graduate' });

    const { showToast } = useToast();

    useEffect(() => {
        if (activeTab === 'candidates') fetchCandidates();
    }, [activeTab]);

    const fetchCandidates = async () => {
        try {
            const res = await axios.get(config.endpoints.candidates.list);
            setCandidates(res.data);
        } catch (e) {
            showToast('Failed to fetch candidates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCandidate = async (e) => {
        e.preventDefault();
        // Simple validation
        if (!formData.name || !formData.email || !formData.phone) {
            return showToast('Please fill required fields', 'error');
        }

        try {
            await axios.post(config.endpoints.candidates.create, {
                ...formData,
                currentStatus: 'Registered', // Default status
                // create endpoint will handle clientId assignment from token
            });
            showToast('Candidate added successfully!');
            setShowAddModal(false);
            setFormData({ name: '', email: '', phone: '', programName: '', qualification: 'Graduate' });
            fetchCandidates();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add candidate', 'error');
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.programName && c.programName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate statistics
    const stats = {
        total: candidates.length,
        active: candidates.filter(c => c.currentStatus !== 'Rejected / Dropped').length,
        training: candidates.filter(c => c.currentStatus === 'Training In Progress').length,
        placed: candidates.filter(c => c.currentStatus === 'Joined').length
    };

    if (selectedCandidateId) {
        return (
            <Layout>
                <CandidateDetail
                    candidateId={selectedCandidateId}
                    onBack={() => {
                        setSelectedCandidateId(null);
                        fetchCandidates();
                    }}
                />
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Add Candidate Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card fade-in" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-card)', padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
                        <h3>Add New Candidate</h3>
                        <form onSubmit={handleAddCandidate} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name *</label>
                                <input placeholder="e.g. Rahul Sharma" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email *</label>
                                <input type="email" placeholder="e.g. rahul@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone *</label>
                                <input type="tel" placeholder="e.g. 9876543210" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Program (Optional)</label>
                                <input placeholder="e.g. Banking Operations" value={formData.programName} onChange={e => setFormData({ ...formData, programName: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Highest Qualification</label>
                                <select value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} style={{ width: '100%' }}>
                                    <option value="Graduate">Graduate</option>
                                    <option value="Post Graduate">Post Graduate</option>
                                    <option value="Under Graduate">Under Graduate</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="primary">Add Candidate</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Bank Partner Portal</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your assigned candidates and support queries.</p>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border)',
                    marginTop: '2rem',
                    marginBottom: '2rem'
                }}>
                    {['candidates', 'inbox', 'announcements', 'resources'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                backgroundColor: 'transparent',
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                                borderRadius: 0,
                                padding: '1rem 0.5rem',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab === 'inbox' ? 'Bank Support Inbox' : tab === 'candidates' ? 'My Candidates' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="fade-in">
                {activeTab === 'candidates' && (
                    <>
                        {/* Statistics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Total Candidates</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.total}</div>
                            </div>
                            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Active</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{stats.active}</div>
                            </div>
                            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>In Training</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.training}</div>
                            </div>
                            <div className="card" style={{ borderLeft: '4px solid hsla(150, 100%, 35%, 1)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Placed</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsla(150, 100%, 35%, 1)' }}>{stats.placed}</div>
                            </div>
                        </div>

                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3>Assigned Candidates</h3>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <input
                                        placeholder="Search candidates..."
                                        style={{ maxWidth: '250px', padding: '0.6rem 1rem' }}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <button onClick={() => setShowAddModal(true)} className="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        + Add Candidate
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="shimmer" style={{ height: '60px', marginBottom: '1rem', borderRadius: 'var(--radius)' }} />
                                    ))}
                                </div>
                            ) : (
                                <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <th style={{ padding: '1rem' }}>Name</th>
                                            <th style={{ padding: '1rem' }}>Program</th>
                                            <th style={{ padding: '1rem' }}>Current Status</th>
                                            <th style={{ padding: '1rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCandidates.map(c => (
                                            <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>{c.name}</td>
                                                <td style={{ padding: '1rem' }}>{c.programName}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        backgroundColor: 'hsla(150, 100%, 35%, 0.1)',
                                                        color: 'var(--success)'
                                                    }}>
                                                        {c.currentStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => setSelectedCandidateId(c._id)}
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveTab('inbox');
                                                            // Logic to select conversation would go here in full impl
                                                            // For now, it just goes to inbox
                                                        }}
                                                        style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}
                                                    >
                                                        Chat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredCandidates.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    {searchTerm ? 'No candidates match your search.' : 'No candidates assigned yet.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'inbox' && <SupportInbox />}
                {activeTab === 'announcements' && <Announcements />}
                {activeTab === 'resources' && <Resources />}
            </div>
        </Layout>
    );
};

export default ClientDashboard;
