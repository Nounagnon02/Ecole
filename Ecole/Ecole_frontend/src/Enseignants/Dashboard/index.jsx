import React, { useState } from 'react';
import { Home, Users, ClipboardList, BookOpen, MessageSquare, Calendar, LogOut, Menu, X } from 'lucide-react';
import { useEnseignantDashboardData } from './hooks/useEnseignantDashboardData';
import OverviewPage from './pages/OverviewPage';
import GestionClassePage from './pages/GestionClassePage';
import NotesPage from './pages/NotesPage';
import CahierTextePage from './pages/CahierTextePage';
import EmploiPage from './pages/EmploiPage';
import Messagerie from '../../components/Messagerie';
import NotificationBell from '../../components/NotificationBell';
import '../../styles/GlobalStyles.css';

const DashboardEnseignant = () => {
    const {
        loading,
        error,
        enseignantData,
        classes,
        emploiTemps,
        devoirs,
        refresh
    } = useEnseignantDashboardData();

    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (loading) return <div className="loading-screen">Chargement...</div>;
    if (error) return <div className="error-screen">{error}</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewPage stats={{
                    classesCount: classes.length,
                    elevesCount: classes.reduce((acc, c) => acc + (c.effectif || 0), 0), // Assuming effectif is present
                    notesCount: '-', // Would need fetching
                    devoirsCount: devoirs.length
                }} />;
            case 'classe':
                return <GestionClassePage classes={classes} />;
            case 'notes':
                return <NotesPage classes={classes} onRefresh={refresh} />;
            case 'cahier':
                return <CahierTextePage devoirs={devoirs} onRefresh={refresh} />;
            case 'emploi':
                return <EmploiPage emploiTemps={emploiTemps} />;
            case 'messages':
                return <Messagerie userId={enseignantData?.id} userName={enseignantData?.nom} />;
            default:
                return <div>Page non trouvée</div>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-title">{sidebarOpen ? 'Espace Prof' : 'EP'}</h1>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {[
                        { id: 'overview', icon: Home, label: 'Aperçu' },
                        { id: 'classe', icon: Users, label: 'Mes Classes' },
                        { id: 'notes', icon: ClipboardList, label: 'Notes' },
                        { id: 'cahier', icon: BookOpen, label: 'Cahier de texte' },
                        { id: 'emploi', icon: Calendar, label: 'Emploi du temps' },
                        { id: 'messages', icon: MessageSquare, label: 'Messages' }
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </div>
                    ))}
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
                    <div className="page-title">
                        {activeTab === 'overview' ? 'Tableau de Bord' :
                            activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </div>

                    <div className="top-bar-actions">
                        <NotificationBell />
                        <div className="profile-menu">
                            <div className="avatar">P</div>
                            <span className="username">{enseignantData?.nom || 'Enseignant'}</span>
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

export default DashboardEnseignant;
