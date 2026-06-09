/**
 * Dashboard Élève — Point d'entrée modulaire
 *
 * Orchestre les pages du dashboard avec DashboardLayout partagé.
 * Utilise useDashboardData pour centraliser les données.
 */
import React, { useState } from 'react';
import { Home, Book, Calendar, FileText, Award, Settings } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useDashboardData } from './hooks/useDashboardData';
import OverviewPage from './pages/OverviewPage';

const navItems = [
  { id: 'dashboard', icon: Home, label: 'Tableau de bord' },
  { id: 'cours', icon: Book, label: 'Mes cours' },
  { id: 'planning', icon: Calendar, label: 'Planning' },
  { id: 'devoirs', icon: FileText, label: 'Devoirs' },
  { id: 'notes', icon: Award, label: 'Mes notes' },
  { id: 'parametres', icon: Settings, label: 'Paramètres' },
];

export default function DashboardEleve() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const data = useDashboardData();

  const pageTitle = navItems.find(n => n.id === activeTab)?.label || 'Dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OverviewPage {...data} />;
      default:
        return (
          <div className="coming-soon">
            <div className="coming-soon-content">
              <h3 className="coming-soon-title">
                Section {pageTitle} en cours de développement
              </h3>
              <p className="coming-soon-text">
                Cette fonctionnalité sera disponible prochainement
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userRole="Élève"
      headerTitle={pageTitle}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
