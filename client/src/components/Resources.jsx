import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';

const Resources = () => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        description: '',
        type: 'Document',
        url: ''
    });

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT_FIC' || user?.role === 'CLIENT_SUPPORT';

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        const res = await axios.get(config.endpoints.resources);
        setResources(res.data);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(config.endpoints.resources, newResource);
            setIsAdding(false);
            setNewResource({ title: '', description: '', type: 'Document', url: '' });
            fetchResources();
        } catch (e) {
            alert('Failed to post resource');
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3>Training Resources & Announcements</h3>
                {isAdmin && (
                    <button className="primary" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Cancel' : '+ New Resource'}
                    </button>
                )}
            </div>

            {isAdding && isAdmin && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem' }}>Title</label>
                            <input value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem' }}>Description</label>
                            <textarea value={newResource.description} onChange={e => setNewResource({ ...newResource, description: e.target.value })} style={{ height: '80px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem' }}>Type</label>
                                <select value={newResource.type} onChange={e => setNewResource({ ...newResource, type: e.target.value })}>
                                    <option value="Document">Document</option>
                                    <option value="Link">Link</option>
                                    <option value="Announcement">Announcement</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem' }}>URL / Link</label>
                                <input value={newResource.url} onChange={e => setNewResource({ ...newResource, url: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>
                        <button type="submit" className="primary" style={{ width: 'fit-content', padding: '0.75rem 2rem' }}>Post Entry</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {resources.map(res => (
                    <div key={res._id} className="card" style={{
                        display: 'flex',
                        gap: '1.5rem',
                        alignItems: 'flex-start',
                        borderLeft: `4px solid ${res.type === 'Announcement' ? 'var(--danger)' : res.type === 'Link' ? 'var(--primary)' : 'var(--success)'}`
                    }}>
                        <div style={{ fontSize: '2rem' }}>
                            {res.type === 'Announcement' ? '📢' : res.type === 'Link' ? '🔗' : '📄'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: 0 }}>{res.title}</h4>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(res.createdAt).toLocaleDateString()}</div>
                            </div>
                            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{res.description}</p>
                            {res.url && (
                                <a href={res.url} target="_blank" rel="noreferrer" style={{
                                    display: 'inline-block',
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: 'var(--bg-main)',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    textDecoration: 'none',
                                    color: 'var(--primary)',
                                    fontWeight: 600,
                                    border: '1px solid var(--border)'
                                }}>
                                    View Resource &rarr;
                                </a>
                            )}
                        </div>
                    </div>
                ))}
                {resources.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
                        No resources or announcements yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Resources;
