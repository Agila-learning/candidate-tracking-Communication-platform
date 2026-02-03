import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const CandidateDetail = ({ candidateId, onBack }) => {
    const [candidate, setCandidate] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [remark, setRemark] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [interviewData, setInterviewData] = useState({
        dateTime: '',
        mode: 'Online',
        locationOrLink: '',
        pocName: '',
        remarks: ''
    });
    const { showToast } = useToast();

    useEffect(() => {
        fetchDetail();
        fetchClients();
    }, [candidateId]);

    const fetchDetail = async () => {
        try {
            const res = await axios.get(`${config.endpoints.candidates.list}/${candidateId}`);
            setCandidate(res.data);
            setNewStatus(res.data.currentStatus);
            setSelectedClientId(res.data.clientId?._id || '');
        } catch (e) {
            console.error(e);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await axios.get(config.endpoints.clients.list);
            setClients(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            await axios.patch(`${config.endpoints.candidates.list}/${candidateId}/status`, {
                newStatus,
                remark
            });
            fetchDetail();
            setRemark('');
            showToast('Status updated successfully!');
        } catch (e) {
            showToast('Update failed', 'error');
        }
    };

    const handleAssignClient = async () => {
        try {
            await axios.patch(`${config.endpoints.candidates.list}/${candidateId}`, { clientId: selectedClientId });
            fetchDetail();
            showToast('Bank partner associated successfully!');
        } catch (e) {
            showToast('Assignment failed', 'error');
        }
    };

    const handleScheduleInterview = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${config.endpoints.candidates.list}/${candidateId}/interview`, interviewData);
            setIsScheduling(false);
            fetchDetail();
            showToast('Interview scheduled successfully!');
        } catch (e) {
            showToast('Scheduling failed', 'error');
        }
    };

    if (!candidate) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={onBack} style={{ backgroundColor: 'transparent', color: 'var(--primary)', border: `1px solid var(--primary)`, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>&larr;</span> Back
                </button>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Candidate File: {candidate.name}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
                <div>
                    {isScheduling ? (
                        <div className="card fade-in">
                            <h3 style={{ marginBottom: '1.5rem' }}>Schedule Interview</h3>
                            <form onSubmit={handleScheduleInterview} style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Proposed Date & Time</label>
                                        <input type="datetime-local" required value={interviewData.dateTime} onChange={e => setInterviewData({ ...interviewData, dateTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Engagement Mode</label>
                                        <select value={interviewData.mode} onChange={e => setInterviewData({ ...interviewData, mode: e.target.value })}>
                                            <option value="Online">Virtual / Link</option>
                                            <option value="Offline">Face-to-Face</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Location URL / Link</label>
                                    <input value={interviewData.locationOrLink} onChange={e => setInterviewData({ ...interviewData, locationOrLink: e.target.value })} placeholder="https://zoom.us/..." />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Bank Representative (POC)</label>
                                    <input value={interviewData.pocName} onChange={e => setInterviewData({ ...interviewData, pocName: e.target.value })} placeholder="e.g. John Doe, HR Axis" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Brief Preparation Notes</label>
                                    <textarea value={interviewData.remarks} onChange={e => setInterviewData({ ...interviewData, remarks: e.target.value })} style={{ height: '80px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="submit" className="primary">Confirm Schedule</button>
                                    <button type="button" onClick={() => setIsScheduling(false)} style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>Dismiss</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{candidate.name}</h2>
                                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{candidate.programName || 'Standard Program'} | {candidate.location || 'Pan India'}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication</label>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{candidate.email}</div>
                                        <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>{candidate.phone}</div>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Association</label>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}>
                                            {candidate.clientId?.name || 'Awaiting Selection'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Highest Qualification</label>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{candidate.qualification || 'Graduate'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ marginBottom: '1.5rem' }}>Milestone History</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {candidate.statusHistory.slice().reverse().map((h, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem 0', borderBottom: i === candidate.statusHistory.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                            <div style={{ width: '120px', flexShrink: 0 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{new Date(h.updatedAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(h.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>{h.newStatus}</div>
                                                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>{h.remark}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <aside>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>Modify Pipeline Status</h3>
                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>Current Phase</label>
                            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ marginBottom: '1.25rem' }}>
                                <option value="Registered">Registered</option>
                                <option value="Documents Collected">Documents Collected</option>
                                <option value="Training In Progress">Training In Progress</option>
                                <option value="Interview Scheduled">Interview Scheduled</option>
                                <option value="Interview Cleared">Interview Cleared</option>
                                <option value="Offer Released">Offer Released</option>
                                <option value="Joined">Joined</option>
                                <option value="Rejected / Dropped">Rejected / Dropped</option>
                            </select>

                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>Internal Note</label>
                            <textarea
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Log a progress update..."
                                style={{ height: '80px', marginBottom: '1.5rem' }}
                            />

                            <button className="primary" onClick={handleUpdateStatus} style={{ width: '100%' }}>
                                Apply Status Change
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3>Bank Association</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Associate this candidate with a specific bank partner.</p>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            style={{ marginBottom: '1rem' }}
                        >
                            <option value="">-- Select Bank Partner --</option>
                            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <button
                            onClick={handleAssignClient}
                            style={{ width: '100%', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }}
                        >
                            Assign Partner
                        </button>
                    </div>

                    <div className="card" style={{ backgroundColor: 'hsla(210, 100%, 50%, 0.03)', border: '1px solid hsla(210, 100%, 50%, 0.2)' }}>
                        <h3>Interview Roadmap</h3>
                        <div style={{ marginTop: '1.5rem' }}>
                            {candidate.interview?.dateTime ? (
                                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span>📅</span> <strong>{new Date(candidate.interview.dateTime).toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span>📍</span> {candidate.interview.mode}: {candidate.interview.locationOrLink}
                                    </div>
                                    {candidate.interview.pocName && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span>👤</span> Rep: {candidate.interview.pocName}
                                    </div>}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                        "{candidate.interview.remarks}"
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                    Awaiting interview schedule details.
                                </p>
                            )}
                            <button
                                onClick={() => setIsScheduling(true)}
                                style={{ width: '100%', marginTop: '0.75rem', backgroundColor: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '0.85rem' }}
                            >
                                {candidate.interview?.dateTime ? 'Update Logistics' : 'Schedule Engagement'}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CandidateDetail;
