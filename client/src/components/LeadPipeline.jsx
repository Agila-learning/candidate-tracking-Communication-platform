import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { config } from '../config';

const LeadPipeline = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingLead, setEditingLead] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
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

    const handleEditClick = (lead) => {
        setEditingLead({ ...lead });
        setShowEditModal(true);
    };

    const handleSaveLead = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${config.endpoints.leads}/${editingLead._id}`, editingLead);
            showToast('Lead updated successfully');
            setShowEditModal(false);
            setEditingLead(null);
            fetchLeads();
        } catch (e) {
            showToast('Failed to update lead', 'error');
        }
    };

    const stages = ['New', 'Contacted', 'Qualified', 'Converted', 'Dropped'];

    if (loading) return <div>Loading pipeline...</div>;

    return (
        <div className="fade-in">
            {/* Edit Modal */}
            {showEditModal && editingLead && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card fade-in" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-card)', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Edit Lead</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>

                        <form onSubmit={handleSaveLead} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Name</label>
                                <input value={editingLead.name} onChange={e => setEditingLead({ ...editingLead, name: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone</label>
                                <input value={editingLead.phone} onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Bank</label>
                                <input value={editingLead.targetBank || ''} placeholder="e.g. Axis Bank" onChange={e => setEditingLead({ ...editingLead, targetBank: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phase</label>
                                <select value={editingLead.phase || 'Phase 1'} onChange={e => setEditingLead({ ...editingLead, phase: e.target.value })} style={{ width: '100%', padding: '0.5rem' }}>
                                    <option value="Phase 1">Phase 1 (Learning)</option>
                                    <option value="Phase 2">Phase 2 (Interview Prep)</option>
                                    <option value="Phase 3">Phase 3 (Placement)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Notes</label>
                                <textarea
                                    value={editingLead.notes || ''}
                                    onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', minHeight: '80px', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="primary" style={{ padding: '0.5rem 1.5rem' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)', padding: '0.5rem' }}>
                            {leads.filter(l => l.stage === stage).map(lead => (
                                <div key={lead._id} className="card" style={{ padding: '1rem', borderTop: `4px solid ${stage === 'Dropped' ? 'var(--danger)' : 'var(--primary)'}`, position: 'relative' }}>
                                    <button
                                        onClick={() => handleEditClick(lead)}
                                        style={{
                                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                                            background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5
                                        }}
                                        title="Edit Lead"
                                    >
                                        ✏️
                                    </button>

                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', paddingRight: '1.5rem' }}>{lead.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                        {lead.phone}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                        {lead.targetBank && (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                                🏦 {lead.targetBank}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.7rem', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' }}>
                                            📍 {lead.phase || 'Phase 1'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {stage !== 'Converted' && stage !== 'Dropped' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStage(lead._id, stages[stages.indexOf(stage) + 1])}
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '4px' }}
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
                                                            borderRadius: '4px',
                                                            border: 'none',
                                                            cursor: 'pointer'
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
                                    fontSize: '0.85rem',
                                    marginTop: '1rem'
                                }}>
                                    No leads in {stage}
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
