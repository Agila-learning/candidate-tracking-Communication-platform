import { useState, useEffect } from 'react';

const MobileDesktopPrompt = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                // Check if we already showed it this session? 
                // User asked for "open in desktop view for 5 seconds".
                // I'll show it immediately, then auto-hide after 5s.
                setShow(true);
                const timer = setTimeout(() => {
                    setShow(false);
                }, 5000);
                return () => clearTimeout(timer);
            }
        };

        checkMobile();
    }, []);

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            backgroundColor: 'rgba(50, 50, 50, 0.95)',
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <div style={{ fontSize: '2rem' }}>💻</div>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Experience Better on Desktop</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                    For full features and best layout, please use a desktop browser.
                </p>
            </div>
            <button
                onClick={() => setShow(false)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                }}
            >
                ✕
            </button>
            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MobileDesktopPrompt;
