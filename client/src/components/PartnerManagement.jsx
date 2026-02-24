import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

/* ─── Partner type config ─────────────────────────────────────── */
const PARTNER_TYPES = [
    { value: 'BANKING', label: '🏦 Banking Partner', badge: '#1e40af', bg: '#dbeafe' },
    { value: 'IT', label: '💻 IT Partner', badge: '#5b21b6', bg: '#ede9fe' },
    { value: 'MANUFACTURING', label: '🏭 Manufacturing Partner', badge: '#c2410c', bg: '#ffedd5' },
    { value: 'NON_IT', label: '📦 Non-IT Partner', badge: '#0f766e', bg: '#ccfbf1' },
    { value: 'OVERSEAS', label: '✈️ Overseas Partner', badge: '#4338ca', bg: '#e0e7ff' },
    { value: 'FIC_HR', label: '👔 FIC HR Partner', badge: '#0891b2', bg: '#ecfeff' },
];

const getTypeInfo = (type) =>
    PARTNER_TYPES.find(t => t.value === type) || PARTNER_TYPES[0];

const EMPTY_FORM = { name: '', pocName: '', pocEmail: '', pocPhone: '', password: '', type: 'BANKING' };

/* ─── Component ─────────────────────────────────────────────── */
const PartnerManagement = ({ onStartChat, userRole }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [resetPasswordId, setResetPasswordId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const { showToast } = useToast();

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data); // Show ALL types
        } catch (e) {
            showToast('Failed to fetch partners', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (showEditForm) {
                await axios.patch(`${config.endpoints.clients.list}/${editingId}`, formData);
                showToast('Partner updated successfully!');
                setShowEditForm(false);
                setEditingId(null);
            } else {
                await axios.post(config.endpoints.clients.create, formData);
                showToast(`${getTypeInfo(formData.type).label} added successfully!`);
                setShowForm(false);
            }
            setFormData({ ...EMPTY_FORM });
            fetchClients();
        } catch (err) {
            showToast(err.response?.data?.error || 'Operation failed', 'error');
        }
    };

    const handleEditClick = (client) => {
        setFormData({
            name: client.name,
            pocName: client.pocName || '',
            pocEmail: client.pocEmail || '',
            pocPhone: client.pocPhone || '',
            type: client.type || 'BANKING',
            password: ''
        });
        setEditingId(client._id);
        setShowEditForm(true);
        setShowForm(false);
    };

    const handleDelete = async (id, clientName) => {
        if (!confirm(`⚠️ Delete ${clientName}? This will affect all associated users and candidates.`)) return;
        try {
            await axios.delete(config.endpoints.clients.delete(id));
            showToast('Partner removed successfully');
            fetchClients();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete', 'error');
        }
    };

    const handleResetPassword = async (clientId) => {
        if (!newPassword || newPassword.trim().length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        try {
            const res = await axios.post(config.endpoints.clients.resetPassword(clientId), { newPassword: newPassword.trim() });
            showToast(res.data.message || 'Password reset successfully!', 'success');
            setResetPasswordId(null);
            setNewPassword('');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to reset password', 'error');
        }
    };

    const handleToggleStatus = async (client) => {
        const action = client.isActive ? 'deactivate' : 'activate';
        const msg = client.isActive
            ? `⚠️ Deactivate ${client.name}? Their users won't be able to login.`
            : `Activate ${client.name}? Associated users will regain access.`;
        if (!confirm(msg)) return;
        try {
            await axios.patch(config.endpoints.clients.toggleStatus(client._id));
            showToast(`${client.name} ${action}d successfully`);
            fetchClients();
        } catch (err) {
            showToast(err.response?.data?.error || `Failed to ${action} partner`, 'error');
        }
    };

    /* ─── Derived filtered list ─ */
    const displayed = clients.filter(c => {
        const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive);
        const matchType = typeFilter === 'ALL' || c.type === typeFilter;
        return matchStatus && matchType;
    });

    if (loading) return (
        <div className="fade-in">
            {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '80px', marginBottom: '1rem', borderRadius: 'var(--radius)' }} />)}
        </div>
    );

    return (
        <div className="fade-in">
            {/* ─── Header row ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>🤝 All Partners</h3>

                    {/* Type Filter */}
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
                        <option value="ALL">All Types ({clients.length})</option>
                        {PARTNER_TYPES.map(t => (
                            <option key={t.value} value={t.value}>
                                {t.label} ({clients.filter(c => c.type === t.value).length})
                            </option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
                        <option value="all">All Status</option>
                        <option value="active">Active ({clients.filter(c => c.isActive).length})</option>
                        <option value="inactive">Inactive ({clients.filter(c => !c.isActive).length})</option>
                    </select>
                </div>

                {userRole === 'ADMIN' && (
                    <button onClick={() => {
                        setShowForm(!showForm);
                        setShowEditForm(false);
                        setFormData({ ...EMPTY_FORM });
                    }}>
                        {showForm ? '✕ Cancel' : '+ Add Partner'}
                    </button>
                )}
            </div>

            {/* ─── Type summary chips ─── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {PARTNER_TYPES.map(t => {
                    const count = clients.filter(c => c.type === t.value).length;
                    if (count === 0) return null;
                    return (
                        <button key={t.value}
                            onClick={() => setTypeFilter(typeFilter === t.value ? 'ALL' : t.value)}
                            style={{
                                padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem',
                                fontWeight: 700, cursor: 'pointer', border: 'none',
                                background: typeFilter === t.value ? t.badge : t.bg,
                                color: typeFilter === t.value ? 'white' : t.badge,
                                transition: 'all 0.2s'
                            }}>
                            {t.label} {count}
                        </button>
                    );
                })}
            </div>

            {/* ─── Add / Edit Form ─── */}
            {(showForm || showEditForm) && (
                <div className="card fade-in" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${showEditForm ? 'var(--primary)' : 'var(--success)'}` }}>
                    <div style={{ marginBottom: '1rem', fontWeight: 600 }}>
                        {showEditForm ? 'Edit Partner Details' : 'Add New Partner'}
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Partner Type — placed first for clarity */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                    Partner Type *
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {PARTNER_TYPES.map(t => (
                                        <label key={t.value} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.4rem 0.85rem', borderRadius: '8px',
                                            border: `2px solid ${formData.type === t.value ? t.badge : 'var(--border)'}`,
                                            background: formData.type === t.value ? t.bg : 'transparent',
                                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                                        }}>
                                            <input type="radio" name="partnerType" value={t.value}
                                                checked={formData.type === t.value}
                                                onChange={() => setFormData({ ...formData, type: t.value })}
                                                style={{ display: 'none' }} />
                                            {t.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <input placeholder="Company / Organisation Name *" required
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input placeholder="POC Name"
                                value={formData.pocName} onChange={e => setFormData({ ...formData, pocName: e.target.value })} />
                            <input type="email" placeholder="POC Email (Login ID) *" required
                                value={formData.pocEmail} onChange={e => setFormData({ ...formData, pocEmail: e.target.value })} />
                            <input type="tel" placeholder="POC Phone (Optional)"
                                value={formData.pocPhone} onChange={e => setFormData({ ...formData, pocPhone: e.target.value.replace(/\s/g, '') })} />
                            <input type="password"
                                placeholder={showEditForm ? 'New Password (leave blank to keep)' : 'Login Password (default: phone or email prefix)'}
                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value.replace(/\s/g, '') })} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit">{showEditForm ? 'Update Partner' : `Add ${getTypeInfo(formData.type).label}`}</button>
                            {showEditForm && (
                                <button type="button" onClick={() => { setShowEditForm(false); setFormData({ ...EMPTY_FORM }); }}
                                    style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* ─── Partner Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {displayed.map(client => {
                    const typeInfo = getTypeInfo(client.type);
                    return (
                        <div key={client._id} className="card" style={{
                            position: 'relative',
                            borderTop: `4px solid ${client.isActive ? typeInfo.badge : '#94a3b8'}`,
                            opacity: client.isActive ? 1 : 0.65,
                            transition: 'opacity 0.2s'
                        }}>
                            {/* ── Type Badge ── */}
                            <span style={{
                                display: 'inline-block', marginBottom: '0.5rem',
                                padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                                background: typeInfo.bg, color: typeInfo.badge
                            }}>
                                {typeInfo.label}
                            </span>

                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{client.name}</div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {/* Active/Inactive toggle */}
                                    <button onClick={() => handleToggleStatus(client)}
                                        disabled={userRole === 'SUB_ADMIN'}
                                        style={{
                                            padding: '0.3rem 0.65rem', fontSize: '0.7rem', fontWeight: 600,
                                            backgroundColor: client.isActive ? 'hsla(150,100%,35%,0.1)' : 'hsla(0,100%,50%,0.1)',
                                            color: client.isActive ? 'var(--success)' : 'var(--danger)',
                                            border: 'none', borderRadius: '20px',
                                            cursor: userRole === 'SUB_ADMIN' ? 'not-allowed' : 'pointer'
                                        }}>
                                        {client.isActive ? '● Active' : '○ Inactive'}
                                    </button>

                                    {/* Chat */}
                                    <button onClick={() => onStartChat ? onStartChat(client._id) : (window.location.href = '/admin?tab=inbox')}
                                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', fontWeight: 600, background: 'var(--bg-main)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: '20px', cursor: 'pointer' }}>
                                        💬 Chat
                                    </button>

                                    {/* Edit */}
                                    {userRole === 'ADMIN' && (
                                        <button onClick={() => handleEditClick(client)}
                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', fontWeight: 600, background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '20px', cursor: 'pointer' }}>
                                            ✏️ Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {client.pocName && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>👤 {client.pocName}</div>}
                            {client.pocEmail && <div style={{ fontSize: '0.82rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>✉️ {client.pocEmail}</div>}
                            {client.pocPhone && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📞 {client.pocPhone}</div>}

                            {/* ── Reset Password (admin only) ── */}
                            {userRole === 'ADMIN' && (
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                                    {resetPasswordId === client._id ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                🔑 Login: <strong>{client.pocEmail}</strong>
                                            </span>
                                            <input type="password" placeholder="New password (min 6 chars)..."
                                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                style={{ flex: 1, minWidth: '150px', padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                                            <button onClick={() => handleResetPassword(client._id)}
                                                style={{ padding: '0.35rem 0.75rem', background: typeInfo.badge, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                                Set
                                            </button>
                                            <button onClick={() => { setResetPasswordId(null); setNewPassword(''); }}
                                                style={{ padding: '0.35rem 0.6rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setResetPasswordId(client._id); setNewPassword(''); }}
                                            style={{ padding: '0.28rem 0.6rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                                            🔑 Reset Login Password
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ── Delete ── */}
                            {userRole !== 'SUB_ADMIN' && (
                                <button onClick={() => handleDelete(client._id, client.name)}
                                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px' }}>
                                    Remove
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {displayed.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {typeFilter !== 'ALL'
                        ? `No ${getTypeInfo(typeFilter).label}s found. Add one using the button above.`
                        : 'No partners yet. Add your first partner using the button above.'}
                </div>
            )}
        </div>
    );
};

export default PartnerManagement;
