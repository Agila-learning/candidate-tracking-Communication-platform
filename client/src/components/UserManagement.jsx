import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CANDIDATE', clientId: '' });
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
            // Note: server/routes/authRoutes.js register endpoint is at /api/auth/register, but here it was posting to /api/users which maps to create user?
            // Checking server/index.js, app.use('/api/users', userRoutes). userRoutes has router.post('/', ...).
            // But checking previous view_file of UserManagement.jsx locally it was POST http://localhost:5000/api/users.
            // Let's check config.js endpoints.users.create doesn't exist?
            // config.endpoints.auth.register is /api/auth/register.
            // The original code used /api/users for creation?
            // Wait, looking at UserManagement.jsx original: `await axios.post('http://localhost:5000/api/users', formData);`
            // Looking at server/routes/userRoutes.js snippet in memory... usually user creation is auth/register.
            // But admins creating users might use /api/users.
            // Let's assume /api/users is correct if the original code used it.
            // config.endpoints.users.list is /api/users. So post to that list endpoint = create.
            // Ensure clientId is null if not provided, to avoid ObjectId casting errors
            const payload = { ...formData };
            if (!payload.clientId) delete payload.clientId;

            await axios.post(config.endpoints.users.list, payload);
            showToast('User created successfully!');
            setFormData({ name: '', email: '', password: '', role: 'CANDIDATE', clientId: '' });
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create user', 'error');
        }
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
        SUPPORT_FIC: 'var(--warning)',
        CLIENT_SUPPORT: 'var(--success)',
        CANDIDATE: 'var(--primary)'
    };

    const filteredUsers = users.filter(u => {
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
                <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {showForm ? '✕ Cancel' : '+ Add User'}
                </button>
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <input placeholder="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <input type="password" placeholder="Password (min 8 chars)" required minLength={8} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="CANDIDATE">Candidate</option>
                                <option value="CLIENT_SUPPORT">Bank Support</option>
                                <option value="SUPPORT_FIC">FIC Support</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            {formData.role === 'CLIENT_SUPPORT' && (
                                <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                                    <option value="">Select Bank...</option>
                                    {clients.filter(c => c.isActive).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            )}
                        </div>
                        <button type="submit" style={{ justifySelf: 'start' }}>Create User</button>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bank</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Login</th>
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
                                            transition: 'all 0.2s'
                                        }}
                                        title={user.isActive ? 'Click to disable' : 'Click to enable'}
                                    >
                                        {user.isActive ? '● Active' : '○ Inactive'}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{user.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: `${roleColors[user.role]}20`,
                                        color: roleColors[user.role]
                                    }}>
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.clientId?.name || '-'}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button onClick={() => handleDelete(user._id)} style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: 'transparent',
                                        color: 'var(--danger)',
                                        border: '1px solid var(--danger)'
                                    }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
