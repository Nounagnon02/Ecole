import React, { useState } from 'react';
import { Home, FileText, CreditCard, MessageSquare, LogOut, Menu, X, User } from 'lucide-react';
import { useParentDashboardData } from './hooks/useParentDashboardData';
import OverviewPage from './pages/OverviewPage';
import BulletinsPage from './pages/BulletinsPage';
import PaiementsPage from './pages/PaiementsPage';
import Messagerie from '../../components/Messagerie';
import NotificationBell from '../../components/NotificationBell';
import '../../styles/GlobalStyles.css';

const ParentDashboard = () => {
    const {
        loading,
        error,
        parentData,
        children,
        bulletins,
        bulletinLoading,
        bulletinErrors,
        notifications,
        absences,
        currentPeriode,
        setCurrentPeriode,
        fetchChildBulletin
    } = useParentDashboardData();

    const [activeTab, setActiveTab] = useState('overview');
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (loading) return <div className="loading-screen">Chargement de votre espace...</div>;
    if (error) return <div className="error-screen">Erreur: {error}</div>;

    const selectedChild = children[selectedChildIndex];
    const selectedBulletin = selectedChild ? bulletins[selectedChild.id] : null;

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <OverviewPage
                        child={selectedChild}
                        notifications={notifications}
                        absences={absences}
                        payments={[]} // Passer les paiements réels si disponibles dans le hook
                    />
                );
            case 'bulletins':
                return (
                    <BulletinsPage
                        child={selectedChild}
                        bulletin={selectedBulletin}
                        loading={bulletinLoading[selectedChild?.id]}
                        error={bulletinErrors[selectedChild?.id]}
                        currentPeriode={currentPeriode}
                        onPeriodeChange={setCurrentPeriode}
                    />
                );
            case 'paiements':
                return <PaiementsPage payments={[]} />; // Connecter les vraie données
            case 'messages':
                return <Messagerie userId={parentData?.id} userName={parentData?.nom} />;
            default:
                return <div>Page non trouvée</div>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-title">{sidebarOpen ? 'Espace Parent' : 'EP'}</h1>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <Home size={20} /> {sidebarOpen && <span>Aperçu</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'bulletins' ? 'active' : ''}`} onClick={() => setActiveTab('bulletins')}>
                        <FileText size={20} /> {sidebarOpen && <span>Bulletins</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'paiements' ? 'active' : ''}`} onClick={() => setActiveTab('paiements')}>
                        <CreditCard size={20} /> {sidebarOpen && <span>Paiements</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
                        <MessageSquare size={20} /> {sidebarOpen && <span>Messages</span>}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-item" onClick={() => window.location.href = '/logout'}>
                        <LogOut size={20} /> {sidebarOpen && <span>Déconnexion</span>}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <header className="top-bar">
                    <div className="child-selector">
                        {children.length > 1 && (
                            <select
                                className="form-select"
                                value={selectedChildIndex}
                                onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                {children.map((child, idx) => (
                                    <option key={child.id} value={idx}>{child.prenom}</option>
                                ))}
                            </select>
                        )}
                        {children.length === 1 && <span className="text-muted">Élève: {children[0].prenom}</span>}
                    </div>

                    <div className="top-bar-actions">
                        <NotificationBell count={notifications.filter(n => !n.read).length} />
                        <div className="profile-menu">
                            <div className="avatar">P</div>
                            <span className="username">{parentData?.nom || 'Parent'}</span>
                        </div>
                    </div>
                </header>

                <main className="content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default ParentDashboard;
