import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const STATUS_COLORS = {
    PENDING: { bg: '#fef3c7', color: '#92400e' },
    SEEN: { bg: '#dbeafe', color: '#1e40af' },
    IN_PROGRESS: { bg: '#e0e7ff', color: '#3730a3' },
    FULFILLED: { bg: '#dcfce7', color: '#166534' },
};

const ClientRequestsPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [notes, setNotes] = useState({});
    const [approving, setApproving] = useState(null); // id currently being approved
    const [approveForm, setApproveForm] = useState({ password: '', type: 'BANKING' });
    const { showToast } = useToast();

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(config.endpoints.clientRequests.list);
            setRequests(res.data);
        } catch (e) {
            showToast('Failed to fetch requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.patch(`${config.endpoints.clientRequests.list}/${id}`, { status, adminNotes: notes[id] || '' });
            showToast(`Request marked as ${status}`);
            fetchRequests();
        } catch (e) {
            showToast('Failed to update', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this request?')) return;
        try {
            await axios.delete(`${config.endpoints.clientRequests.list}/${id}`);
            showToast('Request deleted');
            fetchRequests();
        } catch (e) {
            showToast('Failed to delete', 'error');
        }
    };

    // ── Approve → Create actual client account ────────────────────────────
    const handleApprove = async (req) => {
        if (!approveForm.password) {
            showToast('Please set a login password before approving.', 'error');
            return;
        }
        try {
            // 1. Create the client account using existing endpoint
            await axios.post(config.endpoints.clients.create, {
                name: req.companyName,
                pocName: req.contactName || '',
                pocEmail: req.contactEmail || '',
                pocPhone: req.contactPhone || '',
                password: approveForm.password,
                type: approveForm.type,
            });
            // 2. Mark the request as FULFILLED
            await axios.patch(`${config.endpoints.clientRequests.list}/${req._id}`, {
                status: 'FULFILLED',
                adminNotes: `Account created. ${notes[req._id] || ''}`.trim()
            });
            showToast(`✅ Account created for ${req.companyName}!`);
            setApproving(null);
            setApproveForm({ password: '', type: 'BANKING' });
            fetchRequests();
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to create account', 'error');
        }
    };

    const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Client Access Requests</h3>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Companies submit these via the public <strong>Request Access</strong> form (<code>/request-services</code>). Approve to create their login account.
                    </p>
                    {pendingCount > 0 && (
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                            ⚠️ {pendingCount} pending {pendingCount > 1 ? 'requests' : 'request'} need attention
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['ALL', 'PENDING', 'SEEN', 'IN_PROGRESS', 'FULFILLED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: '0.4rem 0.9rem', borderRadius: '20px',
                                border: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                background: filter === f ? 'var(--primary)' : 'transparent',
                                color: filter === f ? 'white' : 'var(--text-muted)'
                            }}>
                            {f === 'ALL' ? `All (${requests.length})` : f === 'PENDING' ? `Pending (${pendingCount})` : f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Workflow explainer ── */}
            <div style={{ background: 'linear-gradient(120deg,#e0e7ff,#eef2ff)', border: '1px solid #c7d2fe', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.83rem', color: '#3730a3' }}>
                <strong>📋 Workflow:</strong>
                &nbsp; Client fills the public form → Request appears here → Admin reviews → Click <strong>"Approve & Create Account"</strong> → Client gets login credentials → They can log in to their dashboard.
            </div>

            {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                    <p>No {filter !== 'ALL' ? filter.toLowerCase().replace('_', ' ') : ''} requests found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filtered.map(req => (
                        <div key={req._id} className="card"
                            style={{ borderLeft: `4px solid ${STATUS_COLORS[req.status]?.color || '#94a3b8'}`, padding: '1.5rem' }}>

                            {/* ── Request Info ── */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{req.companyName}</h4>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                                            background: STATUS_COLORS[req.status]?.bg, color: STATUS_COLORS[req.status]?.color
                                        }}>
                                            {req.status.replace('_', ' ')}
                                        </span>
                                        {req.status === 'FULFILLED' && (
                                            <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>✅ Account Created</span>
                                        )}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                        <span>📋 {req.roleType}</span>&nbsp;|&nbsp;
                                        <span>👥 {req.headcount} headcount</span>&nbsp;|&nbsp;
                                        <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        <strong>{req.contactName || 'N/A'}</strong> — {req.contactEmail}
                                        {req.contactPhone && ` | ${req.contactPhone}`}
                                    </div>
                                    {req.description && (
                                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{req.description}"</p>
                                    )}
                                </div>
                                <button onClick={() => handleDelete(req._id)}
                                    style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Delete
                                </button>
                            </div>

                            {/* ── Status + Notes Row ── */}
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input placeholder="Admin notes (optional)..." value={notes[req._id] || ''}
                                    onChange={e => setNotes({ ...notes, [req._id]: e.target.value })}
                                    style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }} />
                                {req.status === 'PENDING' && (
                                    <button onClick={() => handleUpdateStatus(req._id, 'SEEN')}
                                        style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                        👁 Mark Seen
                                    </button>
                                )}
                                <button onClick={() => handleUpdateStatus(req._id, 'IN_PROGRESS')}
                                    style={{ padding: '0.45rem 0.9rem', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                    🔄 In Progress
                                </button>
                            </div>

                            {/* ── Approve & Create Account ── */}
                            {req.status !== 'FULFILLED' && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    {approving === req._id ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', alignItems: 'end' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                                                    Partner Type
                                                </label>
                                                <select value={approveForm.type}
                                                    onChange={e => setApproveForm({ ...approveForm, type: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                                    <option value="BANKING">🏦 Banking Partner</option>
                                                    <option value="IT">💻 IT Partner</option>
                                                    <option value="MANUFACTURING">🏭 Manufacturing Partner</option>
                                                    <option value="NON_IT">📦 Non-IT Partner</option>
                                                    <option value="OVERSEAS">✈️ Overseas Partner</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                                                    Login Password *
                                                </label>
                                                <input type="password" placeholder="Set initial password..."
                                                    value={approveForm.password}
                                                    onChange={e => setApproveForm({ ...approveForm, password: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleApprove(req)}
                                                    style={{ flex: 1, padding: '0.55rem 0.75rem', background: '#166534', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                                                    ✅ Confirm & Create
                                                </button>
                                                <button onClick={() => setApproving(null)}
                                                    style={{ padding: '0.55rem 0.75rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setApproving(req._id); setApproveForm({ password: '', type: 'BANKING' }); }}
                                            style={{ padding: '0.55rem 1.25rem', background: 'linear-gradient(120deg,#166534,#15803d)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🚀 Approve &amp; Create Account
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientRequestsPanel;
