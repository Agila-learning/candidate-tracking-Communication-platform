import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const STATUS_COLORS = {
    PENDING: { bg: '#fef3c7', color: '#92400e' },
    SEEN: { bg: '#dbeafe', color: '#1e40af' },
    IN_PROGRESS: { bg: '#e0e7ff', color: '#3730a3' },
    FULFILLED: { bg: '#dcfce7', color: '#166534' }
};

const ClientRequestsPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [notes, setNotes] = useState({});
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

    const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Client Staffing Requests</h3>
                    {pendingCount > 0 && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#92400e' }}>
                            ⚠️ {pendingCount} pending request{pendingCount > 1 ? 's' : ''} need attention
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['ALL', 'PENDING', 'SEEN', 'IN_PROGRESS', 'FULFILLED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: '0.4rem 0.9rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                background: filter === f ? 'var(--primary)' : 'transparent',
                                color: filter === f ? 'white' : 'var(--text-muted)'
                            }}>
                            {f === 'ALL' ? `All (${requests.length})` : f === 'PENDING' ? `Pending (${pendingCount})` : f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <p>Loading...</p> : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                    <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filtered.map(req => (
                        <div key={req._id} className="card" style={{ borderLeft: `4px solid ${STATUS_COLORS[req.status]?.color || '#94a3b8'}`, padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{req.companyName}</h4>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                                            background: STATUS_COLORS[req.status]?.bg, color: STATUS_COLORS[req.status]?.color
                                        }}>
                                            {req.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                        <span>📋 {req.roleType}</span> &nbsp;|&nbsp;
                                        <span>👥 {req.headcount} headcount</span> &nbsp;|&nbsp;
                                        <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        <strong>{req.contactName || 'N/A'}</strong> — {req.contactEmail}
                                        {req.contactPhone && ` | ${req.contactPhone}`}
                                    </div>
                                    {req.description && <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{req.description}"</p>}
                                </div>
                                <button onClick={() => handleDelete(req._id)}
                                    style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Delete
                                </button>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input placeholder="Admin notes (optional)..." value={notes[req._id] || ''}
                                    onChange={e => setNotes({ ...notes, [req._id]: e.target.value })}
                                    style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }} />
                                {req.status === 'PENDING' && <button onClick={() => handleUpdateStatus(req._id, 'SEEN')} style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>👁 Mark Seen</button>}
                                <button onClick={() => handleUpdateStatus(req._id, 'IN_PROGRESS')} style={{ padding: '0.45rem 0.9rem', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>🔄 In Progress</button>
                                <button onClick={() => handleUpdateStatus(req._id, 'FULFILLED')} style={{ padding: '0.45rem 0.9rem', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>✅ Fulfilled</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientRequestsPanel;
