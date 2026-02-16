import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const Announcements = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', message: '' });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canPost = ['ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'].includes(user?.role);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get(config.endpoints.announcements);
            setAnnouncements(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.message.trim()) return;

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('message', formData.message);
            if (file) {
                data.append('attachment', file);
            }

            await axios.post(config.endpoints.announcements, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Announcement posted successfully', 'success');
            setFormData({ title: '', message: '' });
            setFile(null);
            fetchAnnouncements();
        } catch (e) {
            console.error(e);
            showToast('Failed to post announcement', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await axios.delete(`${config.endpoints.announcements}/${id}`);
            showToast('Announcement deleted', 'success');
            fetchAnnouncements();
        } catch (e) {
            showToast('Failed to delete', 'error');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3>📢 Announcements</h3>
            </div>

            {canPost && (
                <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)', backgroundColor: 'transparent' }}>
                    <h4 style={{ marginTop: 0 }}>Post New Announcement</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            placeholder="Title"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                        />
                        <textarea
                            placeholder="Message content..."
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            required
                            rows={4}
                            style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', resize: 'vertical' }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📎 Attach File:
                                <input
                                    type="file"
                                    onChange={e => setFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png"
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {loading ? (
                    <div>Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No announcements yet.
                    </div>
                ) : (
                    announcements.map(item => (
                        <div key={item._id} className="card" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title}</h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {item.isGlobal ? (
                                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>FIC Admin</span>
                                        ) : (
                                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{item.clientId?.name || 'Bank Partner'}</span>
                                        )}
                                        {' • '}{formatDate(item.createdAt)}
                                    </div>
                                </div>
                                {canPost && (user?.role === 'ADMIN' || user?.role === 'SUPPORT_FIC' || user?._id === item.senderId?._id) && (
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        style={{
                                            background: '#fee2e2',
                                            border: '1px solid #fecaca',
                                            cursor: 'pointer',
                                            color: '#dc2626',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title="Delete Announcement"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                {item.message}
                            </div>

                            {item.attachmentUrl && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                    <a
                                        href={item.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--primary)',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            padding: '0.5rem',
                                            backgroundColor: 'hsla(210, 100%, 50%, 0.1)',
                                            borderRadius: 'var(--radius)'
                                        }}
                                    >
                                        📎 Download Attachment {item.attachmentName ? `(${item.attachmentName})` : ''}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Announcements;
