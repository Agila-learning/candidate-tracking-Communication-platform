// FIC Platform v1.2.1 - Agency Dashboard
import { useState, useEffect, useCallback } from 'react';

import ReactDOM from 'react-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { useToast } from '../context/ToastContext';
import Chat from '../components/Chat';

/* ─── Status colour map ─────────────────────────────────────── */
const STATUS_COLORS = {
    'Registered': { bg: '#e0f2fe', color: '#0369a1' },
    'Documents Collected': { bg: '#ede9fe', color: '#5b21b6' },
    'Shortlisted': { bg: '#fce7f3', color: '#be185d' },
    'Training In Progress': { bg: '#fef3c7', color: '#92400e' },
    'Training Completed': { bg: '#d1fae5', color: '#065f46' },
    'Interview Scheduled': { bg: '#fef9c3', color: '#713f12' },
    'Interview Attended': { bg: '#dcfce7', color: '#15803d' },
    'Interview Cleared': { bg: '#bbf7d0', color: '#166534' },
    'Offer Released': { bg: '#dbeafe', color: '#1d4ed8' },
    'Joining Confirmed': { bg: '#f0fdf4', color: '#15803d' },
    'Joined': { bg: '#dcfce7', color: '#166534' },
    'Rejected / Dropped': { bg: '#fee2e2', color: '#991b1b' },
    'default': { bg: 'hsla(210,100%,50%,0.1)', color: 'var(--primary)' },
};

const getStatusStyle = (status) =>
    STATUS_COLORS[status] || STATUS_COLORS['default'];

const ALL_STATUSES = [
    'Registered', 'Documents Collected', 'Shortlisted', 'Training In Progress', 'Training Completed',
    'Interview Scheduled', 'Interview Attended', 'Interview Cleared',
    'Offer Released', 'Joining Confirmed', 'Joined', 'Rejected / Dropped'
];


/* ─── CandidateForm — self-contained with its OWN state ───────────────────
   Moving form state here means the parent (AgencyDashboard) is never
   re-rendered while the user types. This is the safest fix for focus loss.  */
const CandidateForm = ({ initialData, onSubmit, onCancel, submitLabel, clients, isAgencyAdmin, isAgent }) => {
    const [form, setForm] = useState(initialData || {
        name: '', phone: '', email: '', referredBy: '',
        location: '', qualification: 'Graduate', programName: '', creationComments: '', resume: null, clientId: '', manualPartnerName: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // If it's a new referral (has no initialData ID), require resume
        if (!initialData?._id && !form.resume) {
            alert('Please upload a resume for the candidate.');
            return;
        }

        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
            <input placeholder="Full Name *" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Phone / Mobile *" required value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\s/g, '') }))} />
            <input placeholder="Email (Optional)" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input placeholder="Referred By (e.g. Walk-In, Job Fair, Agent Name)"
                value={form.referredBy}
                onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))} />
            <input placeholder="Location" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <select value={form.qualification}
                onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}>
                <option value="Graduate">Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
                <option value="Under Graduate">Under Graduate</option>
                <option value="Other">Other</option>
            </select>
            <input placeholder="Program / Batch / Comments"
                value={form.programName}
                onChange={e => setForm(f => ({ ...f, programName: e.target.value }))} />
            <textarea placeholder="Optional: Special notes or referral comments..."
                value={form.creationComments}
                onChange={e => setForm(f => ({ ...f, creationComments: e.target.value }))}
                style={{ height: '70px', fontSize: '0.85rem' }} />
            <div style={{ padding: '0.5rem', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Resume {initialData?._id ? '(Optional for updates)' : '*'}
                </label>
                <input type="file" accept=".pdf,.doc,.docx" required={!initialData?._id}
                    onChange={e => setForm(f => ({ ...f, resume: e.target.files[0] }))} />
            </div>

            {isAgencyAdmin && (
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Assign to Client <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>Admin</span>
                    </label>
                    <select
                        style={{ width: '100%', marginTop: '0.3rem' }}
                        value={form.clientId || ''}
                        onChange={e => setForm(f => ({ ...f, clientId: e.target.value, manualPartnerName: '' }))}
                    >
                        <option value="">— No Assignment —</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.type})</option>
                        ))}
                        <option value="__OTHERS__">Others (Enter Manually)</option>
                    </select>
                    {form.clientId === '__OTHERS__' && (
                        <input
                            placeholder="Enter company / bank name..."
                            value={form.manualPartnerName || ''}
                            onChange={e => setForm(f => ({ ...f, manualPartnerName: e.target.value }))}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.9rem' }}
                        />
                    )}
                </div>
            )}

            {isAgent && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                    ℹ️ Client assignment is handled by Admin after reviewing candidate performance.
                </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={onCancel}
                    style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                    Cancel
                </button>
                <button type="submit" className="primary">{submitLabel}</button>
            </div>
        </form>
    );
};



/* ─── Component ─────────────────────────────────────────────── */
const AgencyDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAgent = user?.role === 'AGENT';          // strict read-only for client assignment
    const isAgencyAdmin = user?.role === 'AGENCY_ADMIN';

    const [candidates, setCandidates] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    /* Modals */
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [newCandidate, setNewCandidate] = useState({
        name: '', email: '', phone: '', location: '',
        qualification: 'Graduate', programName: '', creationComments: '', resume: null, referredBy: ''
    });

    /* Filters */
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClient, setFilterClient] = useState('');

    /* Chat State */
    const [showChat, setShowChat] = useState(false);
    const [chatTarget, setChatTarget] = useState(null); // 'admin' or 'hr'
    const [activeConversationId, setActiveConversationId] = useState(null);

    const handleStartChat = async (target) => {
        try {
            setChatTarget(target);
            const res = await axios.post(`${config.endpoints.chat}/agent/init/${target}`);
            setActiveConversationId(res.data._id);
            setShowChat(true);
        } catch (err) {
            showToast('Failed to start chat', 'error');
        }
    };

    useEffect(() => {
        fetchCandidates();
        fetchClients();
    }, []);

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

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data.filter(c => c.isActive));
        } catch (e) { /* silent */ }
    };

    /* ── CRUD ── */
    const handleAddCandidate = async (formValues) => {
        try {
            const fd = new FormData();
            Object.keys(formValues).forEach(key => {
                if (key === 'resume') {
                    if (formValues.resume) fd.append('resume', formValues.resume);
                } else {
                    fd.append(key, formValues[key]);
                }
            });
            await axios.post(config.endpoints.candidates.create, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Candidate referred successfully!');
            setShowAddModal(false);
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
            programName: candidate.programName || '',
        });
        setShowEditModal(true);
    };

    const handleUpdateCandidate = async (formValues) => {
        try {
            const payload = {
                name: formValues.name,
                phone: formValues.phone,
                location: formValues.location,
                qualification: formValues.qualification,
                programName: formValues.programName
            };
            await axios.patch(`${config.endpoints.candidates.list}/${editingCandidate._id}`, payload);
            showToast('Candidate updated!');
            setShowEditModal(false);
            setEditingCandidate(null);
            fetchCandidates();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update', 'error');
        }
    };

    const handleDeleteCandidate = async (id) => {
        if (!window.confirm('Delete this candidate? This cannot be undone.')) return;
        try {
            await axios.delete(`${config.endpoints.candidates.list}/${id}`);
            showToast('Candidate deleted');
            fetchCandidates();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete', 'error');
        }
    };

    /* ── Filter ── */
    const filtered = candidates.filter(c => {
        const matchSearch = !searchTerm ||
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm);
        const matchStatus = !filterStatus || c.currentStatus === filterStatus;
        const matchClient = !filterClient || c.clientId?._id === filterClient || c.clientId?.name === filterClient;
        return matchSearch && matchStatus && matchClient;
    });

    /* ── Stats ── */
    const stats = ALL_STATUSES.map(s => ({
        label: s,
        count: candidates.filter(c => c.currentStatus === s).length
    })).filter(s => s.count > 0);

    const mine = candidates.filter(c => c.createdBy?._id === user?._id);

    /* ── Modal Field Component: rendered via stable top-level CandidateForm ── */

    return (
        <Layout>
            {/* ─── Page Header ─── */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>{isAgent ? '🤝 Agent Dashboard' : '🏢 Agency Admin Portal'}</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Welcome, <strong>{user?.name}</strong>
                            &nbsp;·&nbsp;
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '12px', background: isAgent ? '#fef3c7' : 'var(--primary-light)', color: isAgent ? '#b45309' : 'var(--primary)', fontWeight: 700 }}>
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </p>
                    </div>
                    <button className="primary" onClick={() => setShowAddModal(true)}>+ Refer Candidate</button>
                </div>

                {/* ─── Stats Row ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{candidates.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>Total Referred</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d' }}>{candidates.filter(c => ['Selected', 'Placed'].includes(c.currentStatus)).length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>Placed / Selected</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309' }}>{candidates.filter(c => c.currentStatus?.includes('Interview')).length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>In Interview</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#5b21b6' }}>{mine.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>My Referrals</div>
                    </div>
                </div>
            </div>

            {/* ─── Communication Center (for agents) ─── */}
            {isAgent && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--primary-light)', borderRadius: '12px', fontSize: '1.5rem' }}>👑</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chat with Admin</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Get updates on placements & partner assignments.</div>
                        </div>
                        <button className="primary" onClick={() => handleStartChat('admin')} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Open Chat</button>
                    </div>
                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: '12px', fontSize: '1.5rem' }}>📋</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chat with HR</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Discuss interview feedback & candidate clearing.</div>
                        </div>
                        <button className="primary" onClick={() => handleStartChat('hr')} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', backgroundColor: '#059669' }}>Open Chat</button>
                    </div>
                </div>
            )}

            {/* ─── Client Access Info Banner (for agents) ─── */}
            {isAgent && (
                <div style={{ background: 'linear-gradient(120deg,#ede9fe,#f5f3ff)', border: '1px solid #c4b5fd', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏢</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#5b21b6', fontSize: '0.9rem' }}>Want your candidates to access a client portal?</div>
                        <div style={{ color: '#7c3aed', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Companies can request platform access via our staffing request form. Clients are assigned by Admin based on candidate performance.
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Candidate Table Card ─── */}
            <div className="card fade-in">
                {/* Section Header */}
                <div className="section-header sh-candidates" style={{ marginBottom: '1.25rem' }}>
                    <span className="sh-icon">🎓</span>
                    <span className="sh-title">Candidate Status Tracker</span>
                    <span className="sh-meta">{filtered.length} of {candidates.length}</span>
                </div>

                {/* ─── Filters ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <input
                        placeholder="🔍 Search name / email / phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '0.6rem 0.9rem', fontSize: '0.9rem' }}
                    />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ padding: '0.6rem 0.9rem', fontSize: '0.9rem' }}
                    >
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={filterClient}
                        onChange={e => setFilterClient(e.target.value)}
                        style={{ padding: '0.6rem 0.9rem', fontSize: '0.9rem' }}
                    >
                        <option value="">All Clients</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                    {(searchTerm || filterStatus || filterClient) && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterClient(''); }}
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}
                        >
                            ✕ Clear Filters
                        </button>
                    )}
                </div>

                {/* ─── Table ─── */}
                {loading ? (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '52px' }} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                        <div style={{ fontWeight: 600 }}>No candidates match your filters</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Try adjusting the filters above</div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', background: 'var(--bg-main)' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>Candidate</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>
                                        {isAgent ? 'Assigned Client' : 'Client'}
                                        {isAgent && <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', color: '#5b21b6', background: '#ede9fe', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>Admin Only</span>}
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Progress Status</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Resume</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Referred By</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => {
                                    const isOwner = c.createdBy?._id === user?._id;
                                    const statusStyle = getStatusStyle(c.currentStatus);
                                    return (
                                        <tr key={c._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{c.phone}</td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                {c.clientId?.name ? (
                                                    <span style={{ fontSize: '0.82rem', padding: '0.2rem 0.55rem', borderRadius: '8px', background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>
                                                        {c.clientId.name}
                                                    </span>
                                                ) : c.manualPartnerName ? (
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.manualPartnerName}</span>
                                                ) : (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {isAgent ? '⏳ Pending admin review' : '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.7rem', borderRadius: '20px',
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.color
                                                }}>
                                                    {c.currentStatus || 'Applied'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                {c.resumeUrl ? (
                                                    <a href={c.resumeUrl} target="_blank" rel="noreferrer"
                                                        style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                                                        📄 View
                                                    </a>
                                                ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {c.referredBy ? (
                                                    <span style={{ fontWeight: 600, color: '#5b21b6' }}>{c.referredBy}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>{c.createdBy?.name || 'Admin'}</span>
                                                )}
                                                {c.createdBy?._id === user?._id && <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.1rem 0.35rem', borderRadius: '6px', fontWeight: 700 }}>You</span>}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                                {isOwner && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditInit(c)}
                                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', marginRight: '0.35rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCandidate(c._id)}
                                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                {!isOwner && (
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View Only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ─── Status Breakdown ─── */}
                {stats.length > 0 && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                            📈 Status Breakdown
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {stats.map(({ label, count }) => {
                                const s = getStatusStyle(label);
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setFilterStatus(filterStatus === label ? '' : label)}
                                        style={{
                                            padding: '0.3rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            backgroundColor: filterStatus === label ? s.color : s.bg,
                                            color: filterStatus === label ? 'white' : s.color,
                                            border: `1px solid ${s.color}40`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {label} <strong>{count}</strong>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Add Modal ─── */}
            {showAddModal && ReactDOM.createPortal(
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-card)', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🎓 Refer New Candidate
                        </h3>
                        <CandidateForm
                            onSubmit={handleAddCandidate}
                            onCancel={() => setShowAddModal(false)}
                            submitLabel="Submit Referral"
                            clients={clients}
                            isAgencyAdmin={isAgencyAdmin}
                            isAgent={isAgent}
                        />
                    </div>
                </div>,
                document.body
            )}

            {/* ─── Edit Modal ─── */}
            {showEditModal && ReactDOM.createPortal(
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-card)', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ✏️ Edit Candidate
                        </h3>
                        <CandidateForm
                            initialData={editingCandidate ? {
                                name: editingCandidate.name || '',
                                phone: editingCandidate.phone || '',
                                email: editingCandidate.email || '',
                                location: editingCandidate.location || '',
                                qualification: editingCandidate.qualification || 'Graduate',
                                programName: editingCandidate.programName || '',
                                referredBy: editingCandidate.referredBy || '',
                                resume: null, clientId: '', manualPartnerName: ''
                            } : undefined}
                            onSubmit={handleUpdateCandidate}
                            onCancel={() => setShowEditModal(false)}
                            submitLabel="Save Changes"
                            clients={clients}
                            isAgencyAdmin={isAgencyAdmin}
                            isAgent={isAgent}
                        />
                    </div>
                </div>,
                document.body
            )}
            {/* ─── Chat Modal ─── */}
            {showChat && activeConversationId && ReactDOM.createPortal(
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', height: '80vh', backgroundColor: 'var(--bg-card)', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: chatTarget === 'hr' ? '#059669' : 'var(--primary)', color: 'white' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Chat with {chatTarget === 'hr' ? 'HR Team' : 'Admin Team'}</h3>
                            <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <Chat conversationId={activeConversationId} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </Layout>
    );
};

export default AgencyDashboard;
