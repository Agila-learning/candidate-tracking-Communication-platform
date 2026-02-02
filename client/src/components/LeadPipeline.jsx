import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const LeadPipeline = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await axios.get(config.endpoints.leads);
            setLeads(res.data);
        } catch (e) {
            console.error(e);
            showToast('Failed to fetch leads', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStage = async (leadId, nextStage) => {
        try {
            await axios.patch(`${config.endpoints.leads}/${leadId}`, { stage: nextStage });
            showToast(`Lead moved to ${nextStage}`);
            fetchLeads();
        } catch (e) {
            showToast('Stage update failed', 'error');
        }
    };

    const handleConvert = async (leadId) => {
        try {
            await axios.post(`${config.endpoints.candidates.create}/from-lead/${leadId}`);
            showToast('Lead converted to candidate successfully!');
            fetchLeads();
        } catch (e) {
            showToast('Conversion failed. Ensure candidate is unique.', 'error');
        }
    };

    const stages = ['New', 'Contacted', 'Qualified', 'Converted', 'Dropped'];

    if (loading) return <div>Loading pipeline...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {stages.map(stage => (
                    <div key={stage} style={{ minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            padding: '0 0.5rem'
                        }}>
                            <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                {stage} ({leads.filter(l => l.stage === stage).length})
                            </h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)', padding: '0.5rem' }}>
                            {leads.filter(l => l.stage === stage).map(lead => (
                                <div key={lead._id} className="card" style={{ padding: '1rem', borderTop: `4px solid ${stage === 'Dropped' ? 'var(--danger)' : 'var(--primary)'}` }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{lead.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        {lead.phone}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {stage !== 'Converted' && stage !== 'Dropped' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStage(lead._id, stages[stages.indexOf(stage) + 1])}
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}
                                                    >
                                                        Next &rarr;
                                                    </button>
                                                    <button
                                                        onClick={() => handleConvert(lead._id)}
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            fontSize: '0.65rem',
                                                            backgroundColor: 'hsla(210, 100%, 50%, 0.1)',
                                                            color: 'var(--primary)',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        Convert
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {leads.filter(l => l.stage === stage).length === 0 && (
                                <div style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: 'var(--radius)',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                }}>
                                    No leads
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeadPipeline;
