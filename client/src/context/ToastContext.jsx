import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="fade-in"
                        style={{
                            padding: '1rem 1.5rem',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--bg-card)',
                            borderLeft: `6px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                            boxShadow: 'var(--shadow-lg)',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            minWidth: '280px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{t.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                            style={{ background: 'transparent', padding: '0.25rem', color: 'var(--text-muted)' }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
