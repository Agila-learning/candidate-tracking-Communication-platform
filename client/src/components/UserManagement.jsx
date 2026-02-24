import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Added 'phone' and 'editingId'
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'CANDIDATE', clientId: '' });
    const [editingId, setEditingId] = useState(null);

    const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
    const { showToast } = useToast();

    useEffect(() => {
        fetchUsers();
        fetchClients();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(config.endpoints.users.list);
            setUsers(res.data);
        } catch (e) {
            showToast('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data);
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.clientId) delete payload.clientId;

            if (payload.role === 'CLIENT_SUPPORT_PARTNER') {
                payload.role = 'CLIENT_SUPPORT';
            }

            // If editing, remove password if empty (keep existing)
            if (editingId && !payload.password) delete payload.password;

            if (editingId) {
                // Update Existing User
                await axios.patch(`${config.endpoints.users.list}/${editingId}`, payload);
                showToast('User updated successfully!');
            } else {
                // Create New User
                await axios.post(config.endpoints.users.list, payload);
                showToast('User created successfully!');
            }

            // Reset Form
            setFormData({ name: '', email: '', phone: '', password: '', role: 'CANDIDATE', clientId: '' });
            setEditingId(null);
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.error || 'Operation failed', 'error');
        }
    };

    const handleEdit = (user) => {
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            password: '',
            role: user.role === 'CLIENT_SUPPORT' ? 'CLIENT_SUPPORT_PARTNER' : user.role,
            clientId: user.clientId?._id || ''
        });
        setEditingId(user._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('⚠️ Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await axios.delete(config.endpoints.users.delete(id));
            showToast('User deleted successfully');
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete', 'error');
        }
    };

    const handleToggleStatus = async (user) => {
        const action = user.isActive ? 'disable' : 'enable';
        const message = user.isActive
            ? `⚠️ Disable ${user.name}'s account? They won't be able to login until re-enabled.`
            : `Enable ${user.name}'s account? They will regain access immediately.`;

        if (!confirm(message)) return;

        try {
            await axios.patch(config.endpoints.users.toggleStatus(user._id));
            showToast(`User ${action}d successfully`);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.error || `Failed to ${action} user`, 'error');
        }
    };

    const roleColors = {
        ADMIN: 'var(--danger)',
        SUB_ADMIN: '#e11d48',
        SUPPORT_FIC: 'var(--warning)',
        CLIENT_SUPPORT: 'var(--success)',
        AGENCY_ADMIN: '#8b5cf6',
        AGENT: '#f59e0b',
        HR: '#10b981',
        CANDIDATE: 'var(--primary)'

    };

    const filteredUsers = users.filter(u => {
        if (u.role === 'AGENT') return false; // Managed in Agents tab
        if (statusFilter === 'active') return u.isActive;
        if (statusFilter === 'inactive') return !u.isActive;
        return true;
    });

    if (loading) {
        return (
            <div className="fade-in">
                {[1, 2, 3].map(i => (
                    <div key={i} className="shimmer" style={{ height: '60px', marginBottom: '1rem', borderRadius: 'var(--radius)' }} />
                ))}
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>👥 User Management</h3>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                        <option value="all">All Users ({users.length})</option>
                        <option value="active">Active ({users.filter(u => u.isActive).length})</option>
                        <option value="inactive">Inactive ({users.filter(u => !u.isActive).length})</option>
                    </select>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', email: '', phone: '', password: '', role: 'CANDIDATE', clientId: '' });
                        setShowForm(!showForm);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {showForm ? '✕ Cancel' : '+ Add User'}
                </button>
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit User' : 'Create New User'}</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name</label>
                                <input placeholder="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email</label>
                                <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone</label>
                                <input
                                    type="tel"
                                    placeholder="Mobile Number"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\s/g, '') })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Password {editingId ? '(Leave blank to keep)' : '(Default: Mobile Number)'}</label>
                                <input
                                    type="password"
                                    placeholder={editingId ? "New Password (Optional)" : "Password (Optional)"}
                                    minLength={8}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value.replace(/\s/g, '') })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Role</label>
                                <select
                                    value={
                                        formData.role === 'CLIENT_SUPPORT'
                                            ? (clients.find(c => c._id === formData.clientId)?.type === 'IT' ? 'CLIENT_SUPPORT_IT' : (clients.find(c => c._id === formData.clientId)?.type === 'BOTH' ? 'CLIENT_SUPPORT_BOTH' : 'CLIENT_SUPPORT_BANK'))
                                            : formData.role
                                    }
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === 'CLIENT_SUPPORT_BANK' || val === 'CLIENT_SUPPORT_IT' || val === 'CLIENT_SUPPORT_BOTH') {
                                            setFormData({ ...formData, role: 'CLIENT_SUPPORT', clientId: '' }); // Reset client when switching type
                                        } else {
                                            setFormData({ ...formData, role: val });
                                        }
                                        // Store the temporary "visual" role in a separate state or just rely on the selection logic
                                        // A better approach for the form state might be to track the "intent"
                                        // Let's use a dataset attribute or just handle it purely in UI render if possible, 
                                        // but we need to know which filter to apply.
                                        // Simpler: Let's store the "visualRole" in state if needed, or just derive it.
                                        // Actually, let's just cheat and store the extended role in formData.role temporarily, 
                                        // and clean it up before submit.
                                        setFormData({ ...formData, role: val, clientId: '' });
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    <option value="CANDIDATE">Candidate</option>
                                    <option value="CLIENT_SUPPORT_PARTNER">🏢 Partner Staff (Client Support — all types)</option>
                                    <option value="SUPPORT_FIC">FIC Support Staff</option>
                                    <option value="AGENCY_ADMIN">Agency Admin</option>
                                    <option value="AGENT">Agent (External)</option>
                                    <option value="HR">HR (Interviewer)</option>
                                    <option value="SUB_ADMIN">Sub Admin (FIC)</option>

                                    <option value="ADMIN">Admin (Super)</option>
                                </select>
                            </div>
                            {(formData.role === 'CLIENT_SUPPORT_PARTNER' || formData.role === 'CLIENT_SUPPORT') && (
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Select Partner Company
                                    </label>
                                    <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} style={{ width: '100%' }}>
                                        <option value="">— Select Partner Company —</option>
                                        {clients
                                            .filter(c => c.isActive)
                                            .map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} ({c.type || 'BANKING'})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button type="submit" style={{ justifySelf: 'start' }}>
                            {editingId ? 'Save Changes' : 'Create User'}
                        </button>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Company</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id} style={{ borderBottom: '1px solid var(--border)', opacity: user.isActive ? 1 : 0.6, transition: 'opacity 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            style={{
                                                padding: '0.35rem 0.75rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                backgroundColor: user.isActive ? 'hsla(150, 100%, 35%, 0.1)' : 'hsla(0, 100%, 50%, 0.1)',
                                                color: user.isActive ? 'var(--success)' : 'var(--danger)',
                                                border: 'none',
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={user.isActive ? 'Click to disable' : 'Click to enable'}
                                        >
                                            {user.isActive ? '● Active' : '○ Inactive'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{user.name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user.phone || '-'}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: `${roleColors[user.role]}20`,
                                            color: roleColors[user.role],
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {user.role === 'CLIENT_SUPPORT' ? 'Client Partner' : user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {user.clientId?.name || (
                                            user.role === 'CLIENT_SUPPORT' ? <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ No Company</span> : '-'
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(user)} style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                backgroundColor: 'transparent',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--primary)',
                                                cursor: 'pointer',
                                                borderRadius: '4px'
                                            }}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(user._id)} style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                backgroundColor: 'transparent',
                                                color: 'var(--danger)',
                                                border: '1px solid var(--danger)',
                                                cursor: 'pointer',
                                                borderRadius: '4px'
                                            }}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {statusFilter === 'all' ? 'No users found. Create your first user above.' : `No ${statusFilter} users.`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
