import { useState, useEffect } from 'react';
import axios from 'axios';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';

const SupportInbox = ({ clients = [], initialConversationId = null, targetCandidate = null, onClearTarget = () => { } }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterClientId, setFilterClientId] = useState('');

    useEffect(() => {
        if (targetCandidate) {
            initiateChat();
        }
    }, [targetCandidate]);

    const initiateChat = async () => {
        try {
            // bank is starting chat with candidate
            const res = await axios.post(`${config.endpoints.chat}/candidate/${targetCandidate._id}/client`);
            const conversation = res.data;

            setConversations(prev => {
                if (!prev.find(c => c._id === conversation._id)) {
                    return [conversation, ...prev];
                }
                return prev;
            });
            setSelectedId(conversation._id);
            onClearTarget();
        } catch (e) {
            console.error("Failed to init chat", e);
        }
    };

    useEffect(() => {
        if (initialConversationId) {
            setSelectedId(initialConversationId);
        }
    }, [initialConversationId]);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${config.endpoints.chat}/my`);
            setConversations(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelect = async (convId) => {
        setSelectedId(convId);
        try {
            await axios.patch(`${config.endpoints.chat}/read/${convId}`);
            fetchConversations();
        } catch (e) {
            console.error('Failed to mark read');
        }
    };

    const handleDeleteConversation = async (e, convId) => {
        e.stopPropagation(); // Prevent selecting the conversation
        if (!confirm('⚠️ Are you sure you want to delete this ENTIRE conversation? \n\nThis will permanently delete ALL messages and attached files for everyone. This action cannot be undone.')) return;

        try {
            await axios.delete(`${config.endpoints.chat}/conversations/${convId}`);
            setConversations(prev => prev.filter(c => c._id !== convId));
            if (selectedId === convId) setSelectedId(null);
        } catch (err) {
            console.error('Failed to delete conversation:', err);
            alert('Failed to delete conversation');
        }
    };

    const filteredConversations = conversations.filter(conv => {
        if (filterType === 'internal' && conv.type !== 'candidate-admin') return false;
        if (filterType === 'bank' && !['candidate-client', 'admin-client'].includes(conv.type)) return false;
        if (filterClientId && conv.clientId?._id !== filterClientId) return false;
        return true;
    });

    return (
        <div className={`support-inbox-grid ${selectedId ? 'chat-active' : ''}`}>
            <div className="inbox-sidebar">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Support Inbox</h4>
                    {['ADMIN', 'SUPPORT_FIC'].includes(user?.role) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                style={{ padding: '0.4rem', fontSize: '0.8rem', width: '100%' }}
                            >
                                <option value="all">All Conversations</option>
                                <option value="internal">Internal (FIC)</option>
                                <option value="bank">Bank Partners</option>
                            </select>
                            {filterType !== 'internal' && (
                                <select
                                    value={filterClientId}
                                    onChange={e => setFilterClientId(e.target.value)}
                                    style={{ padding: '0.4rem', fontSize: '0.8rem', width: '100%' }}
                                    disabled={filterType === 'internal'}
                                >
                                    <option value="">All Banks</option>
                                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                </div>
                {filteredConversations.map(conv => {
                    const unread = conv.unreadCounts?.[user?._id] || 0;
                    return (
                        <div
                            key={conv._id}
                            onClick={() => handleSelect(conv._id)}
                            style={{
                                padding: '1.25rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: selectedId === conv._id ? 'hsla(210, 100%, 50%, 0.05)' : 'transparent',
                                borderLeft: selectedId === conv._id ? '4px solid var(--primary)' : '4px solid transparent',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                    {conv.candidateId?.name || conv.clientId?.name || 'Unknown User'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: unread > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontWeight: unread > 0 ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: 1
                                }}>
                                    {conv.lastMessage || 'No messages yet'}
                                </div>
                                {unread > 0 && (
                                    <div style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '10px',
                                        padding: '0.1rem 0.4rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        marginLeft: '0.5rem'
                                    }}>
                                        {unread}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: conv.type === 'candidate-admin' ? 'var(--primary)' : 'var(--success)',
                                fontWeight: 700,
                                marginTop: '0.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.4rem'
                            }}>
                                <span>
                                    {conv.type === 'candidate-admin' ? 'Internal: FIC' : conv.type === 'admin-client' ? 'Direct: Bank' : `External: ${conv.clientId?.name || 'Bank'}`}
                                </span>
                                {user?.role === 'ADMIN' && (
                                    <button
                                        onClick={(e) => handleDeleteConversation(e, conv._id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--danger)',
                                            padding: '2px',
                                            fontSize: '0.8rem',
                                            opacity: 0.7
                                        }}
                                        title="Delete Conversation"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredConversations.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No conversations found
                    </div>
                )}
            </div>
            <div className="inbox-main">
                {selectedId ? (
                    <>
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: 'var(--bg-main)' }} className="mobile-header">
                            <button className="mobile-back-btn" onClick={() => setSelectedId(null)}>
                                ← Back
                            </button>
                            {/* Optional: Add active chat info header here */}
                        </div>
                        <Chat conversationId={selectedId} />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportInbox;
