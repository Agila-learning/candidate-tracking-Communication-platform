import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                borderRight: '1px solid var(--border)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh',
                backgroundColor: 'var(--bg-card)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div className="sidebar-logo-container">
                    <img src="/logo.jpg" alt="Forge India" className="sidebar-logo" />
                </div>

                <nav style={{ flex: 1 }}>
                    <NavLink to="/" className="nav-link">
                        <span className="nav-icon">🏠</span>
                        Dashboard
                    </NavLink>

                    {user?.role === 'ADMIN' && (
                        <>
                            <NavLink to="/admin" className="nav-link">
                                <span className="nav-icon">🛡️</span>
                                Admin Center
                            </NavLink>
                        </>
                    )}

                    {user?.role === 'CLIENT_SUPPORT' && (
                        <NavLink to="/client" className="nav-link">
                            <span className="nav-icon">🏦</span>
                            Partner Portal
                        </NavLink>
                    )}

                    {user?.role === 'CANDIDATE' && (
                        <NavLink to="/candidate" className="nav-link">
                            <span className="nav-icon">🎓</span>
                            My Portal
                        </NavLink>
                    )}
                </nav>

                <div style={{ padding: '0 0.5rem' }}>
                    <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius)' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                        }}>
                            {user?.name?.[0]}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{user?.role.replace('_', ' ')}</div>
                        </div>
                    </div>
                    <button onClick={logout} style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '0.85rem',
                        backgroundColor: 'transparent',
                        color: 'var(--danger)',
                        border: '1px solid var(--danger-light)',
                        transition: 'var(--transition)'
                    }}>
                        🚪 Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
