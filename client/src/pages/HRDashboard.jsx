import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import CandidateDetail from '../components/CandidateDetail';
import { useToast } from '../context/ToastContext';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';
import SupportInbox from '../components/SupportInbox';
import ReactDOM from 'react-dom';
import Chat from '../components/Chat';

const HRDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('queue'); // queue, history
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [referredOnly, setReferredOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await axios.get(config.endpoints.candidates.list);
            setCandidates(res.data);
        } catch (e) {
            console.error(e);
            showToast('Failed to load candidates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async () => {
        try {
            const res = await axios.post(`${config.endpoints.chat}/agent/init/admin`);
            setActiveConversationId(res.data._id);
            setShowChat(true);
        } catch (e) {
            showToast('Failed to start chat with Admin', 'error');
        }
    };

    const stats = {
        total: candidates.length,
        pending: candidates.filter(c => c.currentStatus === 'Registered').length,
        scheduled: candidates.filter(c => c.currentStatus === 'Interview Scheduled').length,
        cleared: candidates.filter(c => c.currentStatus === 'Interview Cleared').length
    };

    const getFilteredByTab = (candidates) => {
        if (activeTab === 'queue') {
            return candidates.filter(c => ['Registered', 'Interview Scheduled', 'Interview Attended', 'Interviewing', 'Training In Progress'].includes(c.currentStatus));
        }
        if (activeTab === 'history') {
            return candidates.filter(c => ['Interview Cleared', 'Rejected / Dropped', 'Joined', 'Backed Out', 'Documentation In Progress'].includes(c.currentStatus));
        }
        return candidates;
    };

    const tabFilteredCandidates = getFilteredByTab(candidates);

    const filteredCandidates = tabFilteredCandidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || c.currentStatus === filterStatus;

        const isReferred = c.referredBy || (c.createdBy?.role === 'AGENT');
        const matchesReferred = !referredOnly || isReferred;

        return matchesSearch && matchesStatus && matchesReferred;
    });

    if (selectedCandidateId) {
        return (
            <Layout title="Candidate Interview">
                <CandidateDetail
                    candidateId={selectedCandidateId}
                    onBack={() => {
                        setSelectedCandidateId(null);
                        fetchCandidates();
                    }}
                />
            </Layout>
        );
    }

    return (
        <Layout title="HR Interview Dashboard">
            <div className="fade-in">
                {/* Stats Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Candidates</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{stats.total}</div>
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>New (Awaiting Review)</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{stats.pending}</div>
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Interviews Scheduled</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{stats.scheduled}</div>
                    </div>
                    <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cleared (Ready for Partner)</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{stats.cleared}</div>
                    </div>
                </div>

                <div className="scrollable-tabs" style={{ marginBottom: '1.5rem' }}>
                    {['queue', 'inbox', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); if (tab === 'inbox') { /* SupportInbox handles its own fetch */ } else { fetchCandidates(); } }}
                            style={{
                                backgroundColor: 'transparent',
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                                borderRadius: 0,
                                padding: '1rem 0.5rem',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab === 'queue' ? '📋 Candidate Queue' : tab === 'inbox' ? '💬 Communication Center' : '📜 Interview History'}
                        </button>
                    ))}
                </div>

                {activeTab === 'inbox' ? (
                    <SupportInbox />
                ) : (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ width: '200px' }}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Registered">New (Registered)</option>
                                    <option value="Interview Scheduled">Interview Scheduled</option>
                                    <option value="Interview Attended">Interview Attended</option>
                                    <option value="Interview Cleared">Interview Cleared</option>
                                    <option value="Training In Progress">Training In Progress</option>
                                    <option value="Rejected / Dropped">Rejected / Dropped</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setReferredOnly(!referredOnly)}
                                className={referredOnly ? "primary" : "secondary"}
                                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                            >
                                {referredOnly ? "✅ Referred Only" : "🌐 All Candidates"}
                            </button>
                            <button onClick={fetchCandidates} className="secondary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                                <span style={{ animation: loading ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }}>🔄</span>
                                {loading ? 'Refreshing...' : 'Refresh List'}
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Candidate</th>
                                        <th style={{ padding: '1rem' }}>Source</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Program</th>
                                        <th style={{ padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.length > 0 ? (
                                        filteredCandidates.map(c => (
                                            <tr key={c._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {c.referredBy || (c.createdBy?.name || 'Self-Registered')}
                                                    {c.createdBy?.role === 'AGENT' && <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', padding: '2px 6px', background: '#fef3c7', color: '#d97706', borderRadius: '10px', fontWeight: 700 }}>AGENT</span>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        backgroundColor: c.currentStatus === 'Registered' ? '#fef3c7' :
                                                            c.currentStatus === 'Interview Cleared' ? '#d1fae5' :
                                                                c.currentStatus === 'Interview Scheduled' ? '#dbeafe' :
                                                                    c.currentStatus === 'Training In Progress' ? '#f3e8ff' : '#f3f4f6',
                                                        color: c.currentStatus === 'Registered' ? '#d97706' :
                                                            c.currentStatus === 'Interview Cleared' ? '#059669' :
                                                                c.currentStatus === 'Interview Scheduled' ? '#2563eb' :
                                                                    c.currentStatus === 'Training In Progress' ? '#7e22ce' : '#4b5563'
                                                    }}>
                                                        {c.currentStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{c.programName || 'N/A'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => setSelectedCandidateId(c._id)}
                                                        className="primary"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    >
                                                        {c.currentStatus === 'Registered' ? 'Start Interview' : 'Manage'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No candidates found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showChat && activeConversationId && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Chat with Admin</h3>
                            <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <Chat conversationId={activeConversationId} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </Layout>
    );
};

export default HRDashboard;
