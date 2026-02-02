import { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
    const [stats, setStats] = useState({
        leads: 0,
        candidates: 0,
        conversions: 0,
        interviews: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // In a real app, these would be dedicated aggregation endpoints
        const leadRes = await axios.get('http://localhost:5000/api/leads');
        const candRes = await axios.get('http://localhost:5000/api/candidates');

        const leads = leadRes.data;
        const cands = candRes.data;

        setStats({
            leads: leads.length,
            candidates: cands.length,
            conversions: leads.filter(l => l.stage === 'Converted').length,
            interviews: cands.filter(c => c.currentStatus.includes('Interview')).length
        });
    };

    const cards = [
        { label: 'Total Leads', value: stats.leads, color: 'var(--primary)' },
        { label: 'Total Candidates', value: stats.candidates, color: 'var(--success)' },
        { label: 'Conversions', value: stats.conversions, color: 'hsl(280, 100%, 60%)' },
        { label: 'Interviewed', value: stats.interviews, color: 'hsl(35, 100%, 50%)' }
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map(card => (
                    <div key={card.label} className="card" style={{ borderLeft: `4px solid ${card.color}` }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{card.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h3>Conversion Rate</h3>
                    <div style={{ marginTop: '2rem', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, backgroundColor: 'var(--border)', height: '100%', borderRadius: '4px', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', bottom: 0, width: '100%',
                                height: `${(stats.conversions / (stats.leads || 1)) * 100}%`,
                                backgroundColor: 'var(--primary)',
                                borderRadius: '4px',
                                transition: 'height 1s ease'
                            }} />
                            <div style={{ position: 'absolute', top: '-1.5rem', width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>Converted</div>
                        </div>
                        <div style={{ flex: 1, backgroundColor: 'var(--border)', height: '100%', borderRadius: '4px', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', bottom: 0, width: '100%',
                                height: `${(stats.interviews / (stats.candidates || 1)) * 100}%`,
                                backgroundColor: 'var(--success)',
                                borderRadius: '4px',
                                transition: 'height 1s ease'
                            }} />
                            <div style={{ position: 'absolute', top: '-1.5rem', width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>Interviewed</div>
                        </div>
                    </div>
                    <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Current conversion efficiency: <strong>{((stats.conversions / (stats.leads || 1)) * 100).toFixed(1)}%</strong>
                    </p>
                </div>

                <div className="card">
                    <h3>Lead Activity</h3>
                    <div style={{ marginTop: '1.5rem' }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }} />
                                <div style={{ fontSize: '0.85rem' }}>
                                    <strong>Lead System:</strong> Automated import triggered at {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
