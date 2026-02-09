import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const ClientManagement = ({ onStartChat, userRole }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', pocName: '', pocEmail: '', pocPhone: '', password: '' });
    const [statusFilter, setStatusFilter] = useState('all');
    const { showToast } = useToast();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data);
        } catch (e) {
            showToast('Failed to fetch clients', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(config.endpoints.clients.create, formData);
            showToast('Bank partner added successfully!');
            setFormData({ name: '', pocName: '', pocEmail: '', pocPhone: '', password: '' });
            setShowForm(false);
            fetchClients();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add client', 'error');
        }
    };

    const handleDelete = async (id, clientName) => {
        if (!confirm(`⚠️ Delete ${clientName}? This will affect all associated users and candidates.`)) return;
        try {
            await axios.delete(config.endpoints.clients.delete(id));
            showToast('Bank partner removed successfully');
            fetchClients();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete', 'error');
        }
    };

    const handleToggleStatus = async (client) => {
        const action = client.isActive ? 'deactivate' : 'activate';
        const message = client.isActive
            ? `⚠️ Deactivate ${client.name}? Users assigned to this bank  won't be able to login.`
            : `Activate ${client.name}? Associated users will regain access.`;

        if (!confirm(message)) return;

        try {
            await axios.patch(config.endpoints.clients.toggleStatus(client._id));
            showToast(`${client.name} ${action}d successfully`);
            fetchClients();
        } catch (err) {
            showToast(err.response?.data?.error || `Failed to ${action} bank partner`, 'error');
        }
    };

    const filteredClients = clients.filter(c => {
        if (statusFilter === 'active') return c.isActive;
        if (statusFilter === 'inactive') return !c.isActive;
        return true;
    });

    if (loading) {
        return (
            <div className="fade-in">
                {[1, 2, 3].map(i => (
                    <div key={i} className="shimmer" style={{ height: '80px', marginBottom: '1rem', borderRadius: 'var(--radius)' }} />
                ))}
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>🏦 Bank Partners</h3>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                        <option value="all">All Banks ({clients.length})</option>
                        <option value="active">Active ({clients.filter(c => c.isActive).length})</option>
                        <option value="inactive">Inactive ({clients.filter(c => !c.isActive).length})</option>
                    </select>
                </div>
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancel' : '+ Add Bank'}
                </button>
            </div>

            {showForm && (
                <div className="card fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <input placeholder="Bank Name (e.g., Axis Bank)" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input placeholder="POC Name" value={formData.pocName} onChange={e => setFormData({ ...formData, pocName: e.target.value })} />
                            <input type="email" placeholder="POC Email" value={formData.pocEmail} onChange={e => setFormData({ ...formData, pocEmail: e.target.value })} />
                            <input type="tel" placeholder="POC Phone" value={formData.pocPhone} onChange={e => setFormData({ ...formData, pocPhone: e.target.value })} />
                            <input type="password" placeholder="Login Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <button type="submit" style={{ justifySelf: 'start' }}>Add Bank Partner</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {filteredClients.map(client => (
                    <div
                        key={client._id}
                        className="card"
                        style={{
                            position: 'relative',
                            borderTop: `4px solid ${client.isActive ? 'var(--success)' : 'var(--danger)'}`,
                            opacity: client.isActive ? 1 : 0.65,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{client.name}</div>
                            <button
                                onClick={() => handleToggleStatus(client)}
                                disabled={userRole === 'SUB_ADMIN'}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    backgroundColor: client.isActive ? 'hsla(150, 100%, 35%, 0.1)' : 'hsla(0, 100%, 50%, 0.1)',
                                    color: client.isActive ? 'var(--success)' : 'var(--danger)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: userRole === 'SUB_ADMIN' ? 'not-allowed' : 'pointer',
                                    opacity: userRole === 'SUB_ADMIN' ? 0.6 : 1
                                }}
                                title={userRole === 'SUB_ADMIN' ? 'View Only' : (client.isActive ? 'Click to deactivate' : 'Click to activate')}
                            >
                                {client.isActive ? '● Active' : '○ Inactive'}
                            </button>
                            {!userRole === 'SUB_ADMIN' && (
                                <button
                                    onClick={() => {
                                        if (onStartChat) onStartChat(client._id);
                                        else window.location.href = `/admin?tab=inbox`;
                                    }}
                                    style={{
                                        marginLeft: '0.5rem',
                                        padding: '0.35rem 0.75rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: 'var(--bg-main)',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '20px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    💬 Chat
                                </button>
                            )}
                        </div>
                        {client.pocName && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>👤 {client.pocName}</div>}
                        {client.pocEmail && <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>✉️ {client.pocEmail}</div>}
                        {client.pocPhone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {client.pocPhone}</div>}
                        {userRole !== 'SUB_ADMIN' && (
                            <button
                                onClick={() => handleDelete(client._id, client.name)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.7rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--danger)',
                                    border: '1px solid var(--danger)'
                                }}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))
                }
            </div >

            {
                filteredClients.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        {statusFilter === 'all' ? 'No bank partners yet. Add your first bank above.' : `No ${statusFilter} bank partners.`}
                    </div>
                )
            }
        </div >
    );
};

export default ClientManagement;
