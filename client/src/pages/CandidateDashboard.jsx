import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Chat from '../components/Chat';
import Resources from '../components/Resources';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const CandidateDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [candidate, setCandidate] = useState(null);
    const [activeTab, setActiveTab] = useState('status');
    const [chatTab, setChatTab] = useState('FIC Support');
    const [ficConversationId, setFicConversationId] = useState(null);
    const [bankConversationId, setBankConversationId] = useState(null);

    const [ficUnread, setFicUnread] = useState(0);
    const [bankUnread, setBankUnread] = useState(0);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(config.endpoints.candidates.list);
            if (res.data.length > 0) {
                const cand = res.data[0];

                // Check if candidate account is active
                if (cand.isActive === false) {
                    setCandidate({ ...cand, accessDenied: true });
                } else {
                    setCandidate(cand);

                    // Fetch Chat Info
                    try {
                        const ficRes = await axios.post(`${config.endpoints.chat}/candidate/${cand._id}/admin`);
                        setFicConversationId(ficRes.data._id);
                        setFicUnread(ficRes.data.unreadCounts?.[user?._id] || 0);

                        if (cand.clientId) {
                            const bankRes = await axios.post(`${config.endpoints.chat}/candidate/${cand._id}/client`);
                            setBankConversationId(bankRes.data._id);
                            setBankUnread(bankRes.data.unreadCounts?.[user?._id] || 0);
                        }
                    } catch (chatErr) {
                        console.error('Chat init error', chatErr);
                    }
                }
            } else {
                // No candidate profile found for this user
                setCandidate({ notFound: true });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            showToast('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChatTabChange = async (tab) => {
        setChatTab(tab);
        const convId = tab === 'FIC Support' ? ficConversationId : bankConversationId;
        if (convId) {
            try {
                await axios.patch(`${config.endpoints.chat}/read/${convId}`);
                if (tab === 'FIC Support') setFicUnread(0);
                else setBankUnread(0);
            } catch (e) { console.error(e); }
        }
    };

    const handleFileUpload = async (e, docName) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);
        formData.append('name', docName);

        try {
            await axios.post(`${config.endpoints.candidates.details(candidate._id)}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast(`${docName} uploaded and verified!`);
            fetchProfile();
        } catch (err) {
            showToast('Upload failed. Please try a smaller file.', 'error');
        }
    };

    if (loading) return <Layout><div style={{ textAlign: 'center', padding: '3rem' }}>Loading profile...</div></Layout>;

    if (candidate?.notFound) {
        return (
            <Layout>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h2>Profile Not Linked</h2>
                    <p>Your mobile number is registered, but we couldn't find a Candidate Profile linked to it.</p>
                    <p>Please contact the Admin to link your profile.</p>
                </div>
            </Layout>
        );
    }

    if (!candidate) return <Layout><div style={{ textAlign: 'center', padding: '3rem' }}>Loading profile...</div></Layout>;

    // Show access denied message if candidate is inactive
    if (candidate.accessDenied) {
        return (
            <Layout>
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
                    <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Access Restricted</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto' }}>
                        Your candidate account has been temporarily disabled by the administrator.
                        Please contact FIC Support for assistance.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <a href="mailto:support@ficbanking.com" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
                            Contact Support
                        </a>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '1.5rem' }}>Candidate Portal</h1>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '2rem'
                }}>
                    {['status', 'resources'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                backgroundColor: 'transparent',
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                                borderRadius: 0,
                                padding: '1rem 0.5rem',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="fade-in">
                {activeTab === 'status' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                        <div>
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>Application Progress</h3>
                                    <div style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: 'hsla(150, 100%, 35%, 0.1)', color: 'var(--success)', borderRadius: '20px', fontWeight: 600 }}>
                                        {candidate.currentStatus}
                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0rem' }}>
                                    {(candidate.statusHistory || []).slice().reverse().map((h, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '1.5rem', position: 'relative', paddingBottom: '2rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    backgroundColor: i === 0 ? 'var(--primary-light)' : 'var(--bg-main)',
                                                    border: `2px solid ${i === 0 ? 'var(--primary)' : 'var(--border)'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    zIndex: 2
                                                }}>
                                                    {i === 0 ? '⭐' : '✓'}
                                                </div>
                                                {i !== candidate.statusHistory.length && (
                                                    <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--border)', marginTop: '4px', marginBottom: '-4px' }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, paddingTop: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: i === 0 ? 'var(--primary)' : 'var(--text-main)' }}>{h.newStatus}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.updatedAt).toLocaleDateString()}</div>
                                                </div>
                                                {h.remark && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>{h.remark}</div>}
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: (candidate.statusHistory || []).length === 0 ? 'var(--primary-light)' : 'var(--bg-main)',
                                                border: `2px solid ${(candidate.statusHistory || []).length === 0 ? 'var(--primary)' : 'var(--border)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.8rem'
                                            }}>
                                                🏁
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, paddingTop: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Application Registered</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(candidate.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Initial enrollment completed. Welcome to FIC!</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ marginTop: '2rem' }}>
                                <h3>Document Center</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                                    {['ID Proof', 'Certificates', 'Photo'].map(doc => {
                                        const uploaded = candidate.documents?.find(d => d.name === doc);
                                        return (
                                            <div key={doc} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', textAlign: 'center', backgroundColor: uploaded ? 'hsla(150, 100%, 35%, 0.05)' : 'transparent' }}>
                                                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{uploaded ? '✅' : '📄'}</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.5rem' }}>{doc}</div>
                                                {uploaded ? (
                                                    <a href={`${config.apiUrl}${uploaded.url}`} target="_blank" style={{ fontSize: '0.65rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View File</a>
                                                ) : (
                                                    <label style={{ display: 'block', padding: '0.3rem', fontSize: '0.65rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                                        Upload <input type="file" hidden onChange={(e) => handleFileUpload(e, doc)} />
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <aside>
                            <div className="card" style={{ padding: 0, overflow: 'hidden', height: '550px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-main)' }}>
                                    {['FIC Support', 'Bank Support'].map(t => {
                                        const unread = t === 'FIC Support' ? ficUnread : bankUnread;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => handleChatTabChange(t)}
                                                style={{
                                                    flex: 1,
                                                    borderRadius: 0,
                                                    backgroundColor: chatTab === t ? 'var(--bg-card)' : 'transparent',
                                                    color: chatTab === t ? 'var(--primary)' : 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    padding: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                {t.split(' ')[0]}
                                                {unread > 0 && (
                                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', borderRadius: '10px', padding: '0.1rem 0.4rem', fontSize: '0.65rem', fontWeight: 700 }}>{unread}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    {chatTab === 'FIC Support' && ficConversationId && <Chat conversationId={ficConversationId} />}
                                    {chatTab === 'Bank Support' && bankConversationId && <Chat conversationId={bankConversationId} />}
                                    {chatTab === 'Bank Support' && !bankConversationId && (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem', fontSize: '0.9rem' }}>
                                            Bank support channel not yet assigned.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {activeTab === 'resources' && <Resources />}
            </div>
        </Layout>
    );
};

export default CandidateDashboard;
