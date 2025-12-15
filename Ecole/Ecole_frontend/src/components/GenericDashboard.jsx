import React, { useState, useEffect } from 'react';
import { PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Menu, Home, Users, Book, ClipboardList, Calendar, X, Bell, LogOut, Settings } from 'lucide-react';
import api from '../api';
import NotificationBell from '../components/NotificationBell';
// Import Modular Pages
import ElevesPage from '../Directeurs/Dashboard/pages/ElevesPage';
import NotesPage from '../Directeurs/Dashboard/pages/NotesPage';
import ClassesPage from '../Directeurs/Dashboard/pages/ClassesPage';
import MatieresPage from '../Directeurs/Dashboard/pages/MatieresPage';
import EmploiDuTempsPage from '../Directeurs/Dashboard/pages/EmploiDuTempsPage';

const GenericDashboard = ({
    title,
    role,
    endpoints, // { effectifEnseignants, effectifClasses, eleves, filterNotes, matieres, classes }
    evaluationTypes
}) => {
    // Global Data State
    const [matieres, setMatieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [series, setSeries] = useState([]);
    const [eleves, setEleves] = useState([]); // Full list for ElevesPage

    // Dashboard Stats State
    const [effectifE, setEffectifE] = useState(0); // Enseignants
    const [effectifC, setEffectifC] = useState(0); // Classes count
    const [effectifEleves, setEffectifEleves] = useState(0);
    const [studentStats, setStudentStats] = useState([]); // For charts
    const [gradeStats, setGradeStats] = useState([]);     // For charts
    const [notifications, setNotifications] = useState([]);
    const [evenements, setEvenements] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('aperçu');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // --- Data Fetching ---
    const fetchGlobalData = async () => {
        setLoading(true);
        try {
            // Parallel fetching for performance
            const [
                resEffectifE,
                resEffectifC,
                resClasses,
                resMatieres,
                resSeries,
                resNotifs,
                resEvents,
                resEleves // Need to fetch full student list for ElevesPage
            ] = await Promise.all([
                api.get(endpoints.effectifEnseignants),
                api.get(endpoints.effectifClasses),
                api.get(endpoints.classes),
                api.get(endpoints.matieres),
                api.get('/series'),
                api.get('/notifications'),
                api.get('/evenements'),
                api.get(endpoints.eleves)
            ]);

            setEffectifE(resEffectifE.data);
            setEffectifC(resEffectifC.data);
            setClasses(resClasses.data);
            setMatieres(resMatieres.data.data || resMatieres.data); // Handle potentially different wrapping
            setSeries(resSeries.data);
            setNotifications(resNotifs.data.data || resNotifs.data);
            setEvenements(resEvents.data.data || resEvents.data);

            // Eleves handling might vary slightly in structure
            const elevesData = resEleves.data?.data?.par_classe?.[""] || [];
            setEleves(elevesData);
            setEffectifEleves(resEleves.data?.data?.total_eleves || 0);

            // Stats specific fetching (optional, can be passed as props if different)
            // For now using M endpoint structure as default, maybe parametrize later if P/S differ significantly
            if (endpoints.statsEleves) {
                const resStats = await api.get(endpoints.statsEleves);
                setStudentStats(resStats.data);
            }
            if (endpoints.statsNotes) {
                const resGrades = await api.get(endpoints.statsNotes);
                setGradeStats(resGrades.data);
            }

        } catch (err) {
            console.error("Erreur chargement dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalData();
    }, [endpoints]);

    // --- Render Helpers ---
    const renderContent = () => {
        switch (activeTab) {
            case 'aperçu':
                return (
                    <div className="dashboard-overview">
                        {/* KPI Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon user-icon"><Users size={24} /></div>
                                <div className="stat-info">
                                    <h3>Total Élèves</h3>
                                    <p className="stat-value">{effectifEleves}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon teacher-icon"><Users size={24} /></div>
                                <div className="stat-info">
                                    <h3>Enseignants</h3>
                                    <p className="stat-value">{effectifE}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon class-icon"><Book size={24} /></div>
                                <div className="stat-info">
                                    <h3>Classes</h3>
                                    <p className="stat-value">{effectifC}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="charts-container">
                            <div className="chart-card">
                                <h3>Évolution des Effectifs</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={studentStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="effectif" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <h3>Répartition des Notes</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={gradeStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#82ca9d" label />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            case 'élèves':
                return <ElevesPage eleves={eleves} classes={classes} onRefresh={fetchGlobalData} />;
            case 'classes':
                return <ClassesPage classes={classes} onRefresh={fetchGlobalData} />;
            case 'matieres':
                return <MatieresPage matieres={matieres} onRefresh={fetchGlobalData} />;
            case 'notes':
                return <NotesPage classes={classes} matieres={matieres} series={series} eleves={eleves} />;
            case 'emploi':
                return <EmploiDuTempsPage classes={classes} matieres={matieres} />;
            default:
                return <div>Page non trouvée</div>;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-title">{sidebarOpen ? 'EcoleGestion' : 'EG'}</h1>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className={`sidebar-item ${activeTab === 'aperçu' ? 'active' : ''}`} onClick={() => setActiveTab('aperçu')}>
                        <Home size={20} /> {sidebarOpen && <span>Aperçu</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'élèves' ? 'active' : ''}`} onClick={() => setActiveTab('élèves')}>
                        <Users size={20} /> {sidebarOpen && <span>Élèves</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
                        <Book size={20} /> {sidebarOpen && <span>Classes</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'matieres' ? 'active' : ''}`} onClick={() => setActiveTab('matieres')}>
                        <Book size={20} /> {sidebarOpen && <span>Matières</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
                        <ClipboardList size={20} /> {sidebarOpen && <span>Notes</span>}
                    </div>
                    <div className={`sidebar-item ${activeTab === 'emploi' ? 'active' : ''}`} onClick={() => setActiveTab('emploi')}>
                        <Calendar size={20} /> {sidebarOpen && <span>Emploi du temps</span>}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-item" onClick={() => window.location.href = '/logout'}> {/* Replace with real logout */}
                        <LogOut size={20} /> {sidebarOpen && <span>Déconnexion</span>}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <header className="top-bar">
                    <h2>{title}</h2>
                    <div className="top-bar-actions">
                        <NotificationBell count={notifications.filter(n => !n.read).length} />
                        <div className="profile-menu" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="avatar">D</div>
                            <span className="username">Directeur {role}</span>
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

export default GenericDashboard;
