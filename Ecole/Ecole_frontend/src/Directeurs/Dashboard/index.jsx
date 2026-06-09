/**
 * Dashboard Directeur — Version optimisée et modulaire
 *
 * Chaque onglet est lazy-loadé dans un Suspense boundary.
 * Les données sont centralisées dans le hook useDashboardData.
 */
import React, { useState, useCallback, Suspense, lazy } from 'react';
import '../../styles/GlobalStyles.css';

// Composants modulaires
import { Sidebar, Header, LoadingSpinner, OverviewTab } from './components';
import { useDashboardData } from './hooks';

// Pages lazy-loadées
const Messagerie = lazy(() => import('../../components/Messagerie'));
const EmploiDuTemps = lazy(() => import('../EmploiDuTemps'));
const MarquagePresence = lazy(() => import('../../components/MarquagePresence'));
const ElevesPage = lazy(() => import('./pages/ElevesPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const MatieresPage = lazy(() => import('./pages/MatieresPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));

export default function Dashboard() {
  // Données centralisées depuis le hook
  const {
    classes,
    classes1,
    eleves,
    matieres,
    matieresSeries,
    series,
    studentData,
    gradeData,
    notifications,
    evenements,
    loading,
    error: dataError,
    refresh,
    refreshSection,
    getClasseCategorie,
    getMatieresBySerie,
    getSerieByClasse,
  } = useDashboardData();

  // États locaux
  const [activeTab, setActiveTab] = useState('aperçu');
  const [expandedSection, setExpandedSection] = useState('statistiques');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Filtres pour les notes
  const [filters, setFilters] = useState({
    classe_id: '', serie_id: '', matiere_id: '', type_evaluation: '', periode: '',
  });
  const [filteredNotes, setFilteredNotes] = useState([]);

  // Handlers
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  // Loading initial
  if (loading) {
    return (
      <div className="app-dashboard">
        <LoadingSpinner message="Chargement du tableau de bord..." />
      </div>
    );
  }

  const renderTab = (tab, Component, props = {}) => {
    if (activeTab !== tab) return null;
    return <Component {...props} />;
  };

  return (
    <div className="app-dashboard">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="main-content">
        <Header activeTab={activeTab} />

        {error && <div className="message error">{error}</div>}
        {message && <div className="message success">{message}</div>}

        <main className="content-area">
          <Suspense fallback={<LoadingSpinner />}>
            {renderTab('aperçu', OverviewTab, {
              studentData,
              gradeData,
              evenements,
              notifications,
              expandedSection,
              onToggleSection: toggleSection,
            })}

            {renderTab('matieres', MatieresPage, { matieres, onRefresh: refreshSection })}
            {renderTab('series', SeriesPage, { series, onRefresh: refreshSection })}
            {renderTab('classes', ClassesPage, { classes: classes1, onRefresh: refreshSection })}
            {renderTab('messages', Messagerie)}
            {renderTab('emploi', EmploiDuTemps)}
            {renderTab('presence', MarquagePresence)}

            {renderTab('élèves', ElevesPage, {
              eleves,
              classes: classes1,
              onRefresh: refreshSection,
            })}

            {renderTab('notes', NotesPage, {
              classes,
              matieres,
              series,
              eleves,
              onRefresh: refreshSection,
            })}

            {/* Fallback pour les onglets pas encore migrés */}
            {['LiaisonSeriesClass', 'LiaisonMatieresAvecCoefficientEtSerieClasses',
              'LierElevesAuxParents', 'enseignantsauxclasses', 'personnel', 'paramètres',
            ].includes(activeTab) && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <h2>Section {activeTab}</h2>
                <p>Cette section utilise les anciens composants du dashboard original.</p>
                <p>La migration complète sera effectuée progressivement.</p>
              </div>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
