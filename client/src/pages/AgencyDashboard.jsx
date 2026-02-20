import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { useToast } from '../context/ToastContext';

const AgencyDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [candidates, setCandidates] = useState([]);
    const [clients, setClients] = useState([]); // For dropdown
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [newCandidate, setNewCandidate] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        qualification: 'Graduate',
        clientId: '',
        programName: '',
        comments: '',
        resume: null
    });

    // Actually, user asked for "comments". Candidate model doesn't have a top-level comments field.
    // I will add it as a 'programName' for now as that's often used for "Program/Batch/Comments" or just ignore if not critical, 
    // BUT safest is to add it to 'programName' or 'location' for visibility.
    // Let's use 'programName' as the "Comments/Program" field since it's a string.

    useEffect(() => {
        fetchCandidates();
        fetchClients();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await axios.get(config.endpoints.candidates.list);
            setCandidates(res.data);
        } catch (e) {
            console.error(e);
            showToast('Failed to fetch candidates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data.filter(c => c.isActive));
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddCandidate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(newCandidate).forEach(key => {
                if (key === 'resume') {
                    if (newCandidate.resume) formData.append('resume', newCandidate.resume);
                } else {
                    formData.append(key, newCandidate[key]);
                }
            });

            // "referredBy" is handled by backend based on user role
            await axios.post(config.endpoints.candidates.create, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Candidate added successfully!');
            setShowAddModal(false);
            setNewCandidate({ name: '', email: '', phone: '', location: '', qualification: 'Graduate', clientId: '', programName: '', comments: '', resume: null });
            fetchCandidates();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add candidate', 'error');
        }
    };

    const handleEditInit = (candidate) => {
        setEditingCandidate(candidate);
        setNewCandidate({
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location || '',
            qualification: candidate.qualification || 'Graduate',
            clientId: candidate.clientId?._id || '',
            programName: candidate.programName || '',
            comments: ''
        });
        setShowEditModal(true);
    };

    const handleUpdateCandidate = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${config.endpoints.candidates.list}/${editingCandidate._id}`, newCandidate);
            showToast('Candidate updated successfully!');
            setShowEditModal(false);
            setEditingCandidate(null);
            setNewCandidate({ name: '', email: '', phone: '', location: '', qualification: 'Graduate', clientId: '', programName: '', comments: '' });
            fetchCandidates();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update candidate', 'error');
        }
    };

    const handleDeleteCandidate = async (id) => {
        if (!window.confirm('Delete this candidate? This cannot be undone.')) return;
        try {
            await axios.delete(`${config.endpoints.candidates.list}/${id}`);
            showToast('Candidate deleted');
            fetchCandidates();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete candidate', 'error');
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>{user?.role === 'AGENT' ? '🤝 Agent Dashboard' : '🏢 Agency Admin Portal'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome, {user?.name} &bull; <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: user?.role === 'AGENT' ? '#fef3c7' : 'var(--bg-main)', color: user?.role === 'AGENT' ? '#b45309' : 'var(--text-muted)' }}>{user?.role}</span></p>
                </div>
                <button className="primary" onClick={() => setShowAddModal(true)}>+ Add Candidate</button>
            </div>

            {/* Add Modal */}
            {showAddModal && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-card)', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Add New Candidate</h3>
                        <form onSubmit={handleAddCandidate} style={{ display: 'grid', gap: '1rem' }}>
                            <input placeholder="Full Name" required value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
                            <input placeholder="Email" type="email" required value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} />
                            <input placeholder="Phone" required value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })} />

                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Bank / Company</label>
                                <select
                                    value={newCandidate.clientId}
                                    onChange={e => setNewCandidate({ ...newCandidate, clientId: e.target.value })}
                                    style={{ width: '100%', marginTop: '0.25rem' }}
                                >
                                    <option value="">Select Client...</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.type || 'BANKING'})</option>
                                    ))}
                                </select>
                            </div>

                            <input placeholder="Qualification" value={newCandidate.qualification} onChange={e => setNewCandidate({ ...newCandidate, qualification: e.target.value })} />
                            <input placeholder="Comments / Program Details" value={newCandidate.programName} onChange={e => setNewCandidate({ ...newCandidate, programName: e.target.value })} />
                            <input placeholder="Location" value={newCandidate.location} onChange={e => setNewCandidate({ ...newCandidate, location: e.target.value })} />

                            <div style={{ padding: '0.5rem', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Resume (Optional)</label>
                                <input type="file" onChange={e => setNewCandidate({ ...newCandidate, resume: e.target.files[0] })} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="primary">Add Candidate</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Modal */}
            {showEditModal && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-card)', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Edit Candidate</h3>
                        <form onSubmit={handleUpdateCandidate} style={{ display: 'grid', gap: '1rem' }}>
                            <input placeholder="Full Name" required value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
                            <input placeholder="Email" type="email" required value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} />
                            <input placeholder="Phone" required value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })} />

                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Bank / Company</label>
                                <select
                                    value={newCandidate.clientId}
                                    onChange={e => setNewCandidate({ ...newCandidate, clientId: e.target.value })}
                                    style={{ width: '100%', marginTop: '0.25rem' }}
                                >
                                    <option value="">Select Client...</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.type || 'BANKING'})</option>
                                    ))}
                                </select>
                            </div>

                            <input placeholder="Qualification" value={newCandidate.qualification} onChange={e => setNewCandidate({ ...newCandidate, qualification: e.target.value })} />
                            <input placeholder="Comments / Program Details" value={newCandidate.programName} onChange={e => setNewCandidate({ ...newCandidate, programName: e.target.value })} />
                            <input placeholder="Location" value={newCandidate.location} onChange={e => setNewCandidate({ ...newCandidate, location: e.target.value })} />

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancel</button>
                                <button type="submit" className="primary">Update Candidate</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <div className="card">
                <h3>Candidate Status</h3>
                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Phone</th>
                                <th style={{ padding: '1rem' }}>Client</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Resume</th>
                                <th style={{ padding: '1rem' }}>Referred By</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map(c => (
                                <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{c.name}</td>
                                    <td style={{ padding: '1rem' }}>{c.phone}</td>
                                    <td style={{ padding: '1rem' }}>{c.clientId?.name || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                            backgroundColor: 'hsla(210, 100%, 50%, 0.1)', color: 'var(--primary)'
                                        }}>
                                            {c.currentStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {c.resumeUrl ? (
                                            <a href={c.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                                                Download
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {c.referredBy || (c.createdBy?.name) || 'Self/Admin'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEditInit(c)}
                                            disabled={c.createdBy?._id !== user._id}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                marginRight: '0.4rem',
                                                backgroundColor: 'transparent',
                                                color: c.createdBy?._id === user._id ? 'var(--primary)' : 'var(--text-muted)',
                                                border: `1px solid ${c.createdBy?._id === user._id ? 'var(--primary)' : 'var(--border)'}`,
                                                cursor: c.createdBy?._id === user._id ? 'pointer' : 'not-allowed',
                                                opacity: c.createdBy?._id === user._id ? 1 : 0.5,
                                                borderRadius: '4px'
                                            }}
                                            title={c.createdBy?._id === user._id ? 'Edit Candidate' : 'View Only (Not Created by You)'}
                                        >
                                            Edit
                                        </button>
                                        {c.createdBy?._id === user._id && (
                                            <button
                                                onClick={() => handleDeleteCandidate(c._id)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {candidates.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No candidates found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
};

export default AgencyDashboard;
