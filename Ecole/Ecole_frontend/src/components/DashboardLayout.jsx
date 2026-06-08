/**
 * DashboardLayout - Composant de mise en page partagée pour tous les dashboards
 *
 * Fournit la structure commune : sidebar + header + zone de notification + zone de contenu.
 * Tous les dashboards utilisent ce composant pour éviter la duplication du layout.
 */
import React from 'react';
import { LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

const DashboardLayout = ({
    navItems,
    activeTab,
    onTabChange,
    userRole,
    notification,
    onCloseNotification,
    headerTitle,
    headerSubtitle,
    wrapperClass = 'app-dashboard',
    headerVariant = 'page',
    headerExtra,
    renderSidebar,
    renderHeader,
    children,
}) => {
    const defaultSidebar = (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>{userRole ? `Espace ${userRole}` : 'EcoleGestion'}</h2>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={activeTab === item.id ? 'active' : ''}
                            onClick={() => onTabChange(item.id)}
                        >
                            <Icon size={20} /> {item.label}
                        </button>
                    );
                })}
            </nav>
            <div className="sidebar-logout" style={{ marginTop: 'auto', padding: '1rem' }}>
                <a
                    href="/connexion"
                    className="btn btn-danger"
                    style={{
                        width: '100%', justifyContent: 'center', display: 'flex',
                        alignItems: 'center', gap: '0.5rem', textDecoration: 'none'
                    }}
                >
                    <LogOut size={20} /> Déconnexion
                </a>
            </div>
        </div>
    );

    return (
        <div className={wrapperClass}>
            {/* Sidebar */}
            {renderSidebar ? renderSidebar() : defaultSidebar}

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                {renderHeader ? renderHeader() : (
                    headerVariant === 'page' ? (
                        <header className="page-header">
                            <div>
                                <h1>{headerTitle || 'Tableau de Bord'}</h1>
                                {headerSubtitle && (
                                    <p style={{ color: 'var(--text-muted)' }}>{headerSubtitle}</p>
                                )}
                            </div>
                            <div className="header-actions">
                                <NotificationBell userId={localStorage.getItem('userId')} />
                                {headerExtra}
                            </div>
                        </header>
                    ) : (
                        <header className="main-header">
                            <h1>{headerTitle || 'Tableau de Bord'}</h1>
                            <div className="header-actions">
                                <NotificationBell userId={localStorage.getItem('userId')} />
                                {headerExtra}
                            </div>
                        </header>
                    )
                )}

                {/* Notification Banner */}
                {notification?.show && (
                    <div
                        className={`notification-banner ${notification.type}`}
                        style={{
                            padding: '0.75rem 1rem', margin: '0 1.5rem', borderRadius: '0.5rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
                            color: notification.type === 'success' ? '#155724' : '#721c24',
                            border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                        }}
                    >
                        <span>{notification.message}</span>
                        <button
                            onClick={onCloseNotification}
                            style={{
                                background: 'none', border: 'none', fontSize: '1.25rem',
                                cursor: 'pointer', color: 'inherit', padding: '0 0.25rem'
                            }}
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
