import { useState, useEffect } from 'react';
import axios from 'axios';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';

const SupportInbox = ({ clients = [] }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterClientId, setFilterClientId] = useState('');

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

    const filteredConversations = conversations.filter(conv => {
        if (filterType === 'internal' && conv.type !== 'candidate-admin') return false;
        if (filterType === 'bank' && conv.type !== 'candidate-client') return false;
        if (filterClientId && conv.clientId?._id !== filterClientId) return false;
        return true;
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '1px', background: 'var(--border)', height: '600px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--bg-card)', overflowY: 'auto' }}>
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
                                    {conv.candidateId?.name || 'Unknown Candidate'}
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
                                gap: '0.4rem'
                            }}>
                                {conv.type === 'candidate-admin' ? 'Internal: FIC' : `External: ${conv.clientId?.name || 'Bank'}`}
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
            <div style={{ background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                {selectedId ? (
                    <Chat conversationId={selectedId} />
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
