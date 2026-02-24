import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import CandidateDetail from '../components/CandidateDetail';
import { useToast } from '../context/ToastContext';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';

const HRDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('queue'); // queue, history
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
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

    const stats = {
        total: candidates.length,
        pending: candidates.filter(c => c.currentStatus === 'Registered').length,
        scheduled: candidates.filter(c => c.currentStatus === 'Interview Scheduled').length,
        cleared: candidates.filter(c => c.currentStatus === 'Interview Cleared').length
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || c.currentStatus === filterStatus;

        // HR queue typically focuses on candidates not yet joined/assigned permanently 
        // but for now, we show all based on filters.
        return matchesSearch && matchesStatus;
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
                                <option value="Rejected / Dropped">Rejected / Dropped</option>
                            </select>
                        </div>
                        <button onClick={fetchCandidates} className="secondary" style={{ padding: '0.6rem 1rem' }}>
                            🔄 Refresh List
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
                                                            c.currentStatus === 'Interview Scheduled' ? '#dbeafe' : '#f3f4f6',
                                                    color: c.currentStatus === 'Registered' ? '#d97706' :
                                                        c.currentStatus === 'Interview Cleared' ? '#059669' :
                                                            c.currentStatus === 'Interview Scheduled' ? '#2563eb' : '#4b5563'
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
            </div>
        </Layout>
    );
};

export default HRDashboard;
