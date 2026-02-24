import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import CandidateDetail from '../components/CandidateDetail';
import LeadPipeline from '../components/LeadPipeline';
import SupportInbox from '../components/SupportInbox';
import Reports from '../components/Reports';
import Resources from '../components/Resources';
import UserManagement from '../components/UserManagement';
import ClientManagement from '../components/ClientManagement';
import ITClientManagement from '../components/ITClientManagement';
import PartnerManagement from '../components/PartnerManagement';
import AgentManagement from '../components/AgentManagement';
import Announcements from '../components/Announcements';
import ClientRequestsPanel from '../components/ClientRequestsPanel';
import { useToast } from '../context/ToastContext';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const isSubAdmin = user?.role === 'SUB_ADMIN';
    const [activeTab, setActiveTab] = useState('candidates');
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [showAddLead, setShowAddLead] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', location: '', targetBank: '', phase: 'Phase 1' });
    const [showAddCandidate, setShowAddCandidate] = useState(false);
    const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', programName: '', location: '', clientId: '', qualification: 'Graduate', resume: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [clients, setClients] = useState([]);
    const [pendingRequestCount, setPendingRequestCount] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        fetchClients();
        fetchPendingCount();
    }, []);

    useEffect(() => {
        if (activeTab === 'candidates') fetchCandidates();
    }, [activeTab]);



    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data.filter(c => c.isActive));
        } catch (e) { console.error(e); }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await axios.get(config.endpoints.clientRequests.pendingCount);
            setPendingRequestCount(res.data.count);
        } catch (e) { /* silently fail */ }
    };

    const fetchCandidates = async () => {
        try {
            const res = await axios.get(config.endpoints.candidates.list);
            setCandidates(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            await axios.post(config.endpoints.leads, newLead);
            setNewLead({ name: '', phone: '', email: '', location: '', targetBank: '', phase: 'Phase 1' });
            setShowAddLead(false);
            setActiveTab('leads');
            showToast('New lead captured successfully!');
        } catch (e) {
            showToast('Failed to create lead', 'error');
        }
    };

    const handleCreateCandidate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(newCandidate).forEach(key => {
                if (key === 'resume') {
                    if (newCandidate.resume) formData.append('resume', newCandidate.resume);
                } else {
                    formData.append(key, newCandidate[key]);
                }
            });

            await axios.post(config.endpoints.candidates.create, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewCandidate({ name: '', email: '', phone: '', programName: '', location: '', clientId: '', qualification: 'Graduate', resume: null });
            setShowAddCandidate(false);
            fetchCandidates();
            showToast('Candidate onboarded successfully!');
        } catch (e) {
            console.error('Creation error:', e);
            const errorMsg = e.response?.data?.error || 'Failed to create candidate.';
            showToast(errorMsg, 'error');
        }
    };

    const [targetConversationId, setTargetConversationId] = useState(null);



    const handleStartChat = async (candidateId) => {
        try {
            // Create or Get conversation
            const res = await axios.post(`${config.endpoints.chat}/candidate/${candidateId}/admin`);
            setTargetConversationId(res.data._id);
            setActiveTab('inbox');
        } catch (e) {
            console.error('Chat start error:', e);
            showToast('Failed to start chat', 'error');
        }
    };

    const handleStartBankChat = async (clientId) => {
        try {
            const res = await axios.post(`${config.endpoints.chat}/client/${clientId}/admin`);
            setTargetConversationId(res.data._id);
            setActiveTab('inbox');
        } catch (e) {
            console.error('Chat start bank error:', e);
            showToast('Failed to start chat with bank', 'error');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Are you sure you want to delete this record? This cannot be undone.')) return;

        try {
            const endpoint = type === 'candidate'
                ? config.endpoints.candidates.delete(id)
                : `${config.endpoints.leads}/${id}`;

            await axios.delete(endpoint);
            showToast(`${type} deleted successfully`);

            if (type === 'candidate') fetchCandidates();
            // Leads are handled in LeadPipeline, we might need a refresh trigger or simple callback if complex
        } catch (e) {
            console.error('Delete error:', e);
            showToast(e.response?.data?.error || 'Failed to delete record', 'error');
        }
    };




    {/* ... (Header) ... */ }

    {/* ... (Tabs) ... */ }

    {/* Candidate List Render Block - Update the Chat Button */ }
    {
        activeTab === 'candidates' && (
            <div>
                {/* ... (Search/Filter) ... */}

                {/* ... (Table) ... */}
                {/* 
                            NOTE: I cannot easily replace just the button inside the loop with simple search/replace logic 
                            unless I target the whole block. 
                            I will rely on the user to use the 'handleStartChat' function I am adding below 
                            and I will update the button onClick separately if I can't match it easily.
                            
                            Actually, I will just add the function definition here and update the button in a separate replace call 
                            to be safe, OR I will include the Render part in this block if I can match the return statement.
                        */}
            </div>
        )
    }



    const handleSyncLogin = async (candidateId) => {
        try {
            await axios.post(`${config.endpoints.candidates.create}/${candidateId}/sync-user`);
            showToast('Login created/synced for candidate');
        } catch (e) {
            showToast('Failed to sync login', 'error');
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesClient = filterClient === '' || c.clientId?._id === filterClient || c.clientId?.name === filterClient;
        return matchesSearch && matchesClient;
    });

    const uniqueClients = Array.from(new Set(candidates.map(c => c.clientId?.name).filter(Boolean)));

    if (selectedCandidateId) {
        return (
            <Layout>
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
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '1.5rem' }}>Admin Control Center</h1>

                <div className="scrollable-tabs">
                    {['candidates', 'leads', 'users', 'agents', 'partners', 'inbox', 'reports', 'resources', 'announcements', 'client_requests'].filter(tab => {
                        if (isSubAdmin) return ['candidates', 'partners', 'client_requests'].includes(tab);
                        return true;
                    }).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); if (tab === 'client_requests') fetchPendingCount(); }}
                            style={{
                                backgroundColor: 'transparent',
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                                borderRadius: 0,
                                padding: '1rem 0.5rem',
                                textTransform: 'capitalize',
                                whiteSpace: 'nowrap',
                                position: 'relative'
                            }}
                        >
                            {tab === 'it_partners' ? 'IT Partners' : tab === 'banks' ? 'Bank Partners' : tab === 'partners' ? '🤝 Partners' : tab === 'client_requests' ? 'Client Requests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'client_requests' && pendingRequestCount > 0 && (
                                <span style={{ position: 'absolute', top: '6px', right: '-4px', background: '#dc2626', color: 'white', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {pendingRequestCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="fade-in">
                {activeTab === 'candidates' && (
                    <div className="card">
                        <div className="section-header sh-candidates">
                            <span className="sh-icon">🎓</span>
                            <span className="sh-title">Candidates</span>
                            <span className="sh-meta">Onboarding & Placement</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
                                <h3>Candidates</h3>
                                <input
                                    placeholder="Search by name..."
                                    style={{ maxWidth: '250px', padding: '0.6rem 1rem' }}
                                    // Replaced by search tool
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <select
                                    style={{ maxWidth: '180px', padding: '0.6rem 1rem' }}
                                    value={filterClient}
                                    onChange={e => setFilterClient(e.target.value)}
                                >
                                    <option value="">All Banks</option>
                                    {uniqueClients.map(client => <option key={client} value={client}>{client}</option>)}
                                </select>
                            </div>
                            <button className="primary" onClick={() => setShowAddCandidate(!showAddCandidate)} disabled={user?.role === 'CLIENT_SUPPORT'} style={{ display: user?.role === 'CLIENT_SUPPORT' ? 'none' : 'block' }}>
                                {showAddCandidate ? 'Cancel' : '+ Manual Onboarding'}
                            </button>
                        </div>

                        {showAddCandidate && (
                            <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-main)' }}>
                                <form onSubmit={handleCreateCandidate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <input placeholder="Full Name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} required />
                                    <input placeholder="Email (must match user record)" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} required />
                                    <input placeholder="Phone" value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value.replace(/\s/g, '') })} required />
                                    <input placeholder="Program Name" value={newCandidate.programName} onChange={e => setNewCandidate({ ...newCandidate, programName: e.target.value })} />
                                    <input placeholder="Location" value={newCandidate.location} onChange={e => setNewCandidate({ ...newCandidate, location: e.target.value })} />
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Upload Resume (Optional)</label>
                                        <input type="file" onChange={e => setNewCandidate({ ...newCandidate, resume: e.target.files[0] })} />
                                    </div>
                                    <select value={newCandidate.qualification} onChange={e => setNewCandidate({ ...newCandidate, qualification: e.target.value })}>
                                        <option value="Graduate">Graduate</option>
                                        <option value="Post Graduate">Post Graduate</option>
                                        <option value="Under Graduate">Under Graduate</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <select
                                        value={newCandidate.clientId}
                                        onChange={e => setNewCandidate({ ...newCandidate, clientId: e.target.value })}
                                        title="Assign to bank partner (optional)"
                                    >
                                        <option value="">No Bank (Not Assigned)</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <div style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Note: The candidate's password will be set to their Mobile Number.
                                    </div>
                                    <button type="submit" className="primary">Create Candidate</button>
                                </form>
                            </div>
                        )}

                        <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>

                            {/* ── Agent-referred candidates needing review ── */}
                            {(() => {
                                const agentReferrals = candidates.filter(c =>
                                    c.createdBy?.role === 'AGENT' &&
                                    (c.currentStatus === 'Registered' || c.currentStatus === 'Documents Collected')
                                );
                                return agentReferrals.length > 0 ? (
                                    <div style={{
                                        margin: '0 0 1rem 0',
                                        background: 'linear-gradient(120deg,#fff7ed,#fff)',
                                        border: '1px solid #fed7aa',
                                        borderLeft: '4px solid #f97316',
                                        borderRadius: '10px', padding: '1rem 1.25rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, color: '#c2410c', fontSize: '0.92rem' }}>
                                                🔔 Agent Referrals Pending Review
                                            </span>
                                            <span style={{ background: '#f97316', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                                                {agentReferrals.length} NEW
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: '#92400e' }}>
                                                Candidates submitted by agents — schedule interviews and assign partners
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {agentReferrals.slice(0, 6).map(c => (
                                                <div key={c._id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    background: 'white', border: '1px solid #fed7aa',
                                                    borderRadius: '8px', padding: '0.35rem 0.6rem'
                                                }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{c.name}</span>
                                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>via {c.createdBy?.name || 'Agent'}</span>
                                                    <button
                                                        onClick={() => setSelectedCandidateId(c._id)}
                                                        style={{ padding: '0.2rem 0.55rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        View &amp; Assign
                                                    </button>
                                                </div>
                                            ))}
                                            {agentReferrals.length > 6 && (
                                                <span style={{ fontSize: '0.78rem', color: '#92400e', alignSelf: 'center', fontWeight: 600 }}>
                                                    +{agentReferrals.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Program</th>
                                        <th style={{ padding: '1rem' }}>Client</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Referred By</th>
                                        <th style={{ padding: '1rem' }}>Resume</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.map(c => {
                                        const isAgentReferred = c.createdBy?.role === 'AGENT';
                                        const isAgencyAdmin = c.createdBy?.role === 'AGENCY_ADMIN';
                                        return (
                                            <tr key={c._id} style={{ borderBottom: '1px solid var(--border)', background: isAgentReferred ? '#fff7ed' : 'transparent' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500 }}>
                                                    {c.name}
                                                    {isAgentReferred && (
                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: '#f97316', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, letterSpacing: '0.03em' }}>
                                                            🤝 Via Agent
                                                        </span>
                                                    )}
                                                    {isAgencyAdmin && (
                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: '#8b5cf6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                                                            Agency
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{c.programName || 'N/A'}</td>
                                                <td style={{ padding: '1rem' }}>{c.clientId?.name || c.manualPartnerName || 'Unassigned'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        backgroundColor: 'hsla(210, 100%, 50%, 0.1)',
                                                        color: 'var(--primary)'
                                                    }}>
                                                        {c.currentStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {c.referredBy || c.createdBy?.name || '—'}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {c.resumeUrl ? (
                                                        <a href={c.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}>Download</a>
                                                    ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => setSelectedCandidateId(c._id)}
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                                                    >
                                                        View Details
                                                    </button>
                                                    {!isSubAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDelete('candidate', c._id)}
                                                                style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                                                            >
                                                                Delete
                                                            </button>
                                                            {!c.userId && (
                                                                <button
                                                                    onClick={() => handleSyncLogin(c._id)}
                                                                    style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}
                                                                    title="Create missing login account"
                                                                >
                                                                    Fix Login
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleStartChat(c._id)}
                                                                style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}
                                                            >
                                                                Chat
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div className="card">
                        <div className="section-header sh-leads">
                            <span className="sh-icon">🎯</span>
                            <span className="sh-title">Lead Management</span>
                            <span className="sh-meta">Pipeline</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button className="primary" onClick={() => setShowAddLead(!showAddLead)}>
                                {showAddLead ? 'Cancel' : '+ New Lead'}
                            </button>
                        </div>

                        {showAddLead && (
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <form onSubmit={handleCreateLead} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <input placeholder="Name" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} required />
                                    <input placeholder="Phone" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} required />
                                    <input placeholder="Email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
                                    <input placeholder="Location" value={newLead.location} onChange={e => setNewLead({ ...newLead, location: e.target.value })} />
                                    <input placeholder="Target Bank" value={newLead.targetBank} onChange={e => setNewLead({ ...newLead, targetBank: e.target.value })} />
                                    <select value={newLead.phase} onChange={e => setNewLead({ ...newLead, phase: e.target.value })}>
                                        <option value="Phase 1">Phase 1 (Learning)</option>
                                        <option value="Phase 2">Phase 2 (Interview Prep)</option>
                                        <option value="Phase 3">Phase 3 (Placement)</option>
                                    </select>
                                    <button type="submit" className="primary">Create Lead</button>
                                </form>
                            </div>
                        )}

                        <LeadPipeline clients={clients} />
                    </div>
                )}

                {activeTab === 'users' && <div className="card"><div className="section-header sh-users"><span className="sh-icon">👥</span><span className="sh-title">User Management</span><span className="sh-meta">Roles & Accounts</span></div><UserManagement /></div>}
                {activeTab === 'agents' && <div className="card"><div className="section-header sh-agents"><span className="sh-icon">🤝</span><span className="sh-title">Agency & Agents</span><span className="sh-meta">Referral Partners</span></div><AgentManagement /></div>}
                {activeTab === 'partners' && <div className="card"><div className="section-header sh-banks"><span className="sh-icon">🤝</span><span className="sh-title">Partners</span><span className="sh-meta">All Partner Types</span></div><PartnerManagement onStartChat={handleStartBankChat} userRole={user?.role} /></div>}
                {/* Legacy tab redirects — keep old routes working */}
                {activeTab === 'banks' && <div className="card"><div className="section-header sh-banks"><span className="sh-icon">🏦</span><span className="sh-title">Bank Partners</span><span className="sh-meta">Banking Clients</span></div><ClientManagement onStartChat={handleStartBankChat} userRole={user?.role} /></div>}
                {activeTab === 'it_partners' && <div className="card"><div className="section-header sh-it_partners"><span className="sh-icon">💻</span><span className="sh-title">IT Partners</span><span className="sh-meta">Technology Clients</span></div><ITClientManagement onStartChat={handleStartBankChat} userRole={user?.role} /></div>}
                {activeTab === 'inbox' && <div className="card"><div className="section-header sh-inbox"><span className="sh-icon">💬</span><span className="sh-title">Support Inbox</span><span className="sh-meta">Live Chat</span></div><SupportInbox clients={clients} initialConversationId={targetConversationId} /></div>}
                {activeTab === 'reports' && <div className="card"><div className="section-header sh-reports"><span className="sh-icon">📊</span><span className="sh-title">Reports & Analytics</span><span className="sh-meta">Insights</span></div><Reports /></div>}
                {activeTab === 'resources' && <div className="card"><div className="section-header sh-resources"><span className="sh-icon">📚</span><span className="sh-title">Resources</span><span className="sh-meta">Learning Materials</span></div><Resources /></div>}
                {activeTab === 'announcements' && <div className="card"><div className="section-header sh-announcements"><span className="sh-icon">📢</span><span className="sh-title">Announcements</span><span className="sh-meta">Broadcasts</span></div><Announcements /></div>}
                {activeTab === 'client_requests' && <div className="card"><div className="section-header sh-client_requests"><span className="sh-icon">📋</span><span className="sh-title">Staffing Requests</span><span className="sh-meta">{pendingRequestCount > 0 ? `${pendingRequestCount} Pending` : 'All Clear'}</span></div><ClientRequestsPanel /></div>}
            </div>
        </Layout >
    );
};

export default AdminDashboard;
