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
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('candidates');
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [showAddLead, setShowAddLead] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', location: '' });
    const [showAddCandidate, setShowAddCandidate] = useState(false);
    const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', programName: '', location: '', clientId: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [clients, setClients] = useState([]);
    const { showToast } = useToast();

    useEffect(() => {
        if (activeTab === 'candidates') fetchCandidates();
        fetchClients();
    }, [activeTab]);

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data.filter(c => c.isActive)); // Only show active clients
        } catch (e) {
            console.error(e);
        }
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
            setNewLead({ name: '', phone: '', email: '', location: '' });
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
            await axios.post(config.endpoints.candidates.create, newCandidate);
            setNewCandidate({ name: '', email: '', phone: '', programName: '', location: '', clientId: '' });
            setShowAddCandidate(false);
            fetchCandidates();
            showToast('Candidate onboarded successfully!');
        } catch (e) {
            showToast('Failed to create candidate. Ensure email is unique.', 'error');
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

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '2rem'
                }}>
                    {['candidates', 'leads', 'users', 'banks', 'inbox', 'reports', 'resources'].map(tab => (
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
                {activeTab === 'candidates' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
                                <h3>Candidates</h3>
                                <input
                                    placeholder="Search by name..."
                                    style={{ maxWidth: '250px', padding: '0.6rem 1rem' }}
                                    value={searchTerm}
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
                            <button className="primary" onClick={() => setShowAddCandidate(!showAddCandidate)}>
                                {showAddCandidate ? 'Cancel' : '+ Manual Onboarding'}
                            </button>
                        </div>

                        {showAddCandidate && (
                            <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-main)' }}>
                                <form onSubmit={handleCreateCandidate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <input placeholder="Full Name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} required />
                                    <input placeholder="Email (must match user record)" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} required />
                                    <input placeholder="Phone" value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })} required />
                                    <input placeholder="Program Name" value={newCandidate.programName} onChange={e => setNewCandidate({ ...newCandidate, programName: e.target.value })} />
                                    <input placeholder="Location" value={newCandidate.location} onChange={e => setNewCandidate({ ...newCandidate, location: e.target.value })} />
                                    <select
                                        value={newCandidate.clientId}
                                        onChange={e => setNewCandidate({ ...newCandidate, clientId: e.target.value })}
                                        title="Assign to bank partner (optional)"
                                    >
                                        <option value="">No Bank (Not Assigned)</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <button type="submit" className="primary">Create Candidate</button>
                                </form>
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Program</th>
                                        <th style={{ padding: '1rem' }}>Client</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCandidates.map(c => (
                                        <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{c.name}</td>
                                            <td style={{ padding: '1rem' }}>{c.programName || 'N/A'}</td>
                                            <td style={{ padding: '1rem' }}>{c.clientId?.name || 'Unassigned'}</td>
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
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => setSelectedCandidateId(c._id)}
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3>Lead Management</h3>
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
                                    <button type="submit" className="primary">Create Lead</button>
                                </form>
                            </div>
                        )}

                        <LeadPipeline />
                    </div>
                )}

                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'banks' && <ClientManagement />}
                {activeTab === 'inbox' && <SupportInbox clients={clients} />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'resources' && <Resources />}
            </div>
        </Layout>
    );
};

export default AdminDashboard;
