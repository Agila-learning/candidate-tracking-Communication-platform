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
        title: '',
        description: '',
        type: 'Document',
        url: '',
        file: null
    });

    const userRole = user?.role || '';
    const isAdmin = ['ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'].includes(userRole);

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
            const formData = new FormData();
            formData.append('title', newResource.title);
            formData.append('description', newResource.description);
            formData.append('type', newResource.type);
            formData.append('url', newResource.url);
            if (newResource.file) {
                formData.append('file', newResource.file);
            }

            await axios.post(config.endpoints.resources, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsAdding(false);
            setNewResource({ title: '', description: '', type: 'Document', url: '', file: null });
            fetchResources();
        } catch (e) {
            alert('Failed to post resource');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resource?')) return;
        try {
            await axios.delete(`${config.endpoints.resources}/${id}`);
            fetchResources();
        } catch (e) {
            alert('Failed to delete resource');
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3>Training Resources ({userRole})</h3>
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
                                <label style={{ fontSize: '0.85rem' }}>{newResource.type === 'Document' ? 'File Upload' : 'URL / Link'}</label>
                                {newResource.type === 'Document' ? (
                                    <input type="file" onChange={e => setNewResource({ ...newResource, file: e.target.files[0] })} />
                                ) : (
                                    <input value={newResource.url} onChange={e => setNewResource({ ...newResource, url: e.target.value })} placeholder="https://..." />
                                )}
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
                                    View Link &rarr;
                                </a>
                            )}
                            {res.fileUrl && (
                                <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{
                                    display: 'inline-block',
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: 'var(--bg-main)',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    textDecoration: 'none',
                                    color: 'var(--primary)',
                                    fontWeight: 600,
                                    border: '1px solid var(--border)',
                                    marginTop: '0.5rem'
                                }}>
                                    Download {res.originalName || 'File'} ⬇️
                                </a>
                            )}
                        </div>
                        {(isAdmin || (user?._id === res.postedBy?._id) || (user?._id === res.postedBy)) && (
                            <button
                                onClick={() => handleDelete(res._id)}
                                style={{
                                    alignSelf: 'flex-start',
                                    padding: '0.4rem 0.8rem',
                                    color: 'var(--danger)',
                                    background: 'transparent',
                                    border: '1px solid var(--danger)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Delete
                            </button>
                        )}
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
