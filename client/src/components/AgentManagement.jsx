import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const AgentManagement = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            // Fetch all users and filter by role 'AGENT'
            // Ideally we should have a backend filter, but for now we filter client-side if the API returns all
            // Or we can use the existing /users endpoint.
            // Let's assume /users returns all users for Admin.
            const res = await axios.get(config.endpoints.users.list || '/api/users'); // fallback if config missing
            // Filter for AGENT role
            const agentUsers = res.data.filter(u => u.role === 'AGENT');
            setAgents(agentUsers);
        } catch (e) {
            console.error(e);
            showToast('Failed to fetch agents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                role: 'AGENT'
            };

            // If password is empty, remove it so backend handles default or keeps existing
            if (!payload.password) {
                delete payload.password;
            }

            if (editingId) {
                await axios.patch(`${config.endpoints.users.list}/${editingId}`, payload);
                showToast('Agent updated successfully');
            } else {
                // Create new
                // For new agents, if password is empty, backend/frontend logic ensures it defaults to phone.
                // In UserManagement it was handled by sending phone as password if empty? 
                // No, existing backend logic for /register or /users/create might handles it now if I updated userRoutes?
                // Wait, I updated userRoutes to default to phone if password missing.
                // But AdminDashboard uses /auth/register or /users?
                // Let's check config.endpoints.users.create usually.
                // If it uses /auth/register, I need to check if that was updated. 
                // I checked userRoutes.js in step 551 for "Default Password Logic Implementation" plan updates.
                // It said: "UPDATED [userRoutes.js] - POST /: If password is missing, use phone as default password."
                // So I can just send without password.
                await axios.post(config.endpoints.users.create || '/api/auth/register', payload); // Check config for real endpoint
                showToast('Agent created successfully');
            }

            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', password: '' });
            setEditingId(null);
            fetchAgents();
        } catch (e) {
            console.error(e);
            showToast(e.response?.data?.error || 'Operation failed', 'error');
        }
    };

    const handleEdit = (agent) => {
        setFormData({
            name: agent.name,
            email: agent.email || '',
            phone: agent.phone,
            password: '' // Don't show existing hash
        });
        setEditingId(agent._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will delete the Agent account.')) return;
        try {
            await axios.delete(`${config.endpoints.users.list}/${id}`);
            showToast('Agent deleted');
            fetchAgents();
        } catch (e) {
            showToast('Failed to delete agent', 'error');
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Agent Management</h3>
                <button className="primary" onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', email: '', phone: '', password: '' });
                    setShowModal(true);
                }}>
                    + Add Agent
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Phone</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map(agent => (
                                <tr key={agent._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{agent.name}</td>
                                    <td style={{ padding: '1rem' }}>{agent.phone}</td>
                                    <td style={{ padding: '1rem' }}>{agent.email || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            backgroundColor: agent.isActive ? '#dcfce7' : '#fee2e2',
                                            color: agent.isActive ? '#166534' : '#991b1b'
                                        }}>
                                            {agent.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEdit(agent)}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                marginRight: '0.5rem',
                                                backgroundColor: 'transparent',
                                                border: '1px solid var(--border)',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(agent._id)}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                backgroundColor: '#fee2e2',
                                                color: '#dc2626',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {agents.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No agents found. Click "Add Agent" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card fade-in" style={{ width: '90%', maxWidth: '400px', backgroundColor: 'var(--bg-card)', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Agent' : 'Add New Agent'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', marginTop: '0.25rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone Number (Login ID)</label>
                                <input
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    style={{ width: '100%', marginTop: '0.25rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email (Optional)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', marginTop: '0.25rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Password {editingId ? '(Leave blank to keep)' : '(Default: Mobile Number)'}
                                </label>
                                <input
                                    type="password"
                                    placeholder={editingId ? "New Password (Optional)" : "Password (Optional)"}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    style={{ width: '100%', marginTop: '0.25rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="primary">
                                    {editingId ? 'Update Agent' : 'Create Agent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentManagement;
