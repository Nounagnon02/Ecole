import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleBasedRedirect from './auth/RoleBasedRedirect';

// Composants chargés immédiatement (critiques pour l'auth)
import LoginForm from './components/LoginForm';

// Composant de chargement pour Suspense
const LoadingSpinner = () => (
  <div className="loading-container" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div className="spinner" style={{
      width: '50px',
      height: '50px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p>Chargement...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// === LAZY LOADING DES DASHBOARDS ===
// Chaque dashboard ne sera chargé que lorsque l'utilisateur y accède

// Dashboards principaux
const DashboardDirecteur = React.lazy(() => import('./Directeurs/dash'));
const DashboardEnseignant = React.lazy(() => import('./Enseignants/DashboardEnseignant'));
const DashboardEleve = React.lazy(() => import('./Eleves/DashboardEleve'));
const DashboardParent = React.lazy(() => import('./Parents/dash'));
const DashboardComptable = React.lazy(() => import('./Comptable/DashboardComptable'));
const DashboardSurveillant = React.lazy(() => import('./Surveillant/DashboardSurveillant'));
const DashboardCenseur = React.lazy(() => import('./Censeur/DashboardCenseur'));
const DashboardInfirmier = React.lazy(() => import('./Infirmier/DashboardInfirmier'));
const DashboardBibliothecaire = React.lazy(() => import('./Bibliothecaire/DashboardBibliothecaire'));
const DashboardSecretaire = React.lazy(() => import('./Secretaire/DashboardSecretaire'));

// Dashboards spécifiques par niveau (de App.js)
const DashboardM = React.lazy(() => import('./DirecteursM/dash'));
const DashboardP = React.lazy(() => import('./DirecteursP/dash'));
const DashboardS = React.lazy(() => import('./DirecteursS/dash'));

// Dashboard ecoliers
const DashboardEcolier = React.lazy(() => import('./Ecoliers/dash'));

// Enseignants par niveau
const DashboardEnseignantPrimaire = React.lazy(() => import('./Enseignants_primaire/DashboardEnseignantPrimaire'));
const DashboardEnseignantSecondaire = React.lazy(() => import('./Enseignants_secondaire/DashboardEnseignantSecondaire'));

// Admin et gestion
const EcoleManagement = React.lazy(() => import('./components/EcoleManagement'));
const SuperAdminDashboard = React.lazy(() => import('./components/SuperAdminDashboard'));

// Université
const UniversiteRoutes = React.lazy(() => import('./Universite/UniversiteRoutes'));

// Autres composants (de App.js)
const Home = React.lazy(() => import('./home/home'));
const Matieres = React.lazy(() => import('./Directeurs/Matieres'));
const GestionExercices = React.lazy(() => import('./components/GestionExercices'));
const CahierTexte = React.lazy(() => import('./components/CahierTexte'));

// Paiements
const PaymentForm = React.lazy(() => import('./paiements/paiement'));
const PaymentSuccess = React.lazy(() => import('./paiements/paiementSucces'));

// Auth Ecoliers et Université
const ConnexionEcolier = React.lazy(() => import('./Ecoliers/Connexion').then(module => ({ default: module.Connexion })));
const InscriptionEcolier = React.lazy(() => import('./Ecoliers/Inscription').then(module => ({ default: module.InscriptionE })));
const ConnexionUniversite = React.lazy(() => import('./Universite/Auth/Connexion').then(module => ({ default: module.ConnexionU })));

// Page non autorisée
const UnauthorizedPage = () => (
  <div className="error-container" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Accès non autorisé</h1>
    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* ============ ROUTES PUBLIQUES ============ */}
            <Route path="/" element={<Home />} />
            <Route path="/connexion" element={<LoginForm />} />
            <Route path="/connexionE" element={<ConnexionEcolier />} />
            <Route path="/connexionU" element={<ConnexionUniversite />} />
            <Route path="/inscription" element={<InscriptionEcolier />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/dashboard" element={<RoleBasedRedirect />} />

            {/* ============ PAIEMENTS (Protégés) ============ */}
            <Route path="/paiement" element={
              <ProtectedRoute allowedRoles={['eleve', 'parent', 'comptable', 'directeur']}>
                <PaymentForm />
              </ProtectedRoute>
            } />
            <Route path="/paiement/succes" element={
              <ProtectedRoute allowedRoles={['eleve', 'parent', 'comptable', 'directeur']}>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            <Route path="/payment-success" element={<Navigate to="/paiement/succes" replace />} />

            {/* ============ DASHBOARDS PAR RÔLE (Protégés) ============ */}

            {/* Directeur général */}
            <Route path="/directeur/dashboard" element={
              <ProtectedRoute allowedRoles={['directeur']}>
                <DashboardDirecteur />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['directeur', 'admin']}>
                <DashboardDirecteur />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Directeurs par niveau */}
            <Route path="/maternelle/dashboard" element={
              <ProtectedRoute allowedRoles={['directeurM']}>
                <DashboardM />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-maternelle" element={<Navigate to="/maternelle/dashboard" replace />} />
            <Route path="/ecole/maternelle" element={<Navigate to="/maternelle/dashboard" replace />} />

            <Route path="/primaire/dashboard" element={
              <ProtectedRoute allowedRoles={['directeurP']}>
                <DashboardP />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-primaire" element={<Navigate to="/primaire/dashboard" replace />} />
            <Route path="/ecole/primaire" element={<Navigate to="/primaire/dashboard" replace />} />

            <Route path="/secondaire/dashboard" element={
              <ProtectedRoute allowedRoles={['directeurS']}>
                <DashboardS />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-secondaire" element={<Navigate to="/secondaire/dashboard" replace />} />
            <Route path="/ecole/secondaire" element={<Navigate to="/secondaire/dashboard" replace />} />

            {/* Enseignants */}
            <Route path="/enseignant/dashboard" element={
              <ProtectedRoute allowedRoles={['enseignant']}>
                <DashboardEnseignant />
              </ProtectedRoute>
            } />
            <Route path="/enseignant/secondaire" element={
              <ProtectedRoute allowedRoles={['enseignement']}>
                <DashboardEnseignantSecondaire />
              </ProtectedRoute>
            } />
            <Route path="/enseignant/maternelle" element={
              <ProtectedRoute allowedRoles={['enseignementM']}>
                <DashboardEnseignantPrimaire />
              </ProtectedRoute>
            } />
            <Route path="/enseignant/primaire" element={
              <ProtectedRoute allowedRoles={['enseignementP']}>
                <DashboardEnseignantPrimaire />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-enseignant" element={<Navigate to="/enseignant/secondaire" replace />} />
            <Route path="/dashboard-enseignementM" element={<Navigate to="/enseignant/maternelle" replace />} />
            <Route path="/dashboard-enseignementP" element={<Navigate to="/enseignant/primaire" replace />} />
            <Route path="/ecole/enseignant" element={<Navigate to="/enseignant/dashboard" replace />} />
            <Route path="/ecole/enseignant/secondaire" element={<Navigate to="/enseignant/secondaire" replace />} />
            <Route path="/ecole/enseignant/primaire" element={<Navigate to="/enseignant/primaire" replace />} />
            <Route path="/ecole/enseignant/maternelle" element={<Navigate to="/enseignant/maternelle" replace />} />

            {/* Élèves */}
            <Route path="/eleve/dashboard" element={
              <ProtectedRoute allowedRoles={['eleve']}>
                <DashboardEleve />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-eleve" element={<Navigate to="/eleve/dashboard" replace />} />

            {/* Parents */}
            <Route path="/parent/dashboard" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <DashboardParent />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-parent" element={<Navigate to="/parent/dashboard" replace />} />

            {/* Personnel administratif */}
            <Route path="/comptable/dashboard" element={
              <ProtectedRoute allowedRoles={['comptable']}>
                <DashboardComptable />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-comptable" element={<Navigate to="/comptable/dashboard" replace />} />
            <Route path="/ecole/comptable" element={
              <ProtectedRoute allowedRoles={['comptable', 'directeur']}>
                <DashboardComptable />
              </ProtectedRoute>
            } />

            <Route path="/surveillant/dashboard" element={
              <ProtectedRoute allowedRoles={['surveillant']}>
                <DashboardSurveillant />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-surveillant" element={<Navigate to="/surveillant/dashboard" replace />} />
            <Route path="/ecole/surveillant" element={
              <ProtectedRoute allowedRoles={['surveillant', 'directeur']}>
                <DashboardSurveillant />
              </ProtectedRoute>
            } />

            <Route path="/censeur/dashboard" element={
              <ProtectedRoute allowedRoles={['censeur']}>
                <DashboardCenseur />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-censeur" element={<Navigate to="/censeur/dashboard" replace />} />
            <Route path="/ecole/censeur" element={
              <ProtectedRoute allowedRoles={['censeur', 'directeur']}>
                <DashboardCenseur />
              </ProtectedRoute>
            } />

            <Route path="/infirmier/dashboard" element={
              <ProtectedRoute allowedRoles={['infirmier']}>
                <DashboardInfirmier />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-infirmier" element={<Navigate to="/infirmier/dashboard" replace />} />
            <Route path="/ecole/infirmier" element={
              <ProtectedRoute allowedRoles={['infirmier', 'directeur']}>
                <DashboardInfirmier />
              </ProtectedRoute>
            } />

            <Route path="/bibliothecaire/dashboard" element={
              <ProtectedRoute allowedRoles={['bibliothecaire']}>
                <DashboardBibliothecaire />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-bibliothecaire" element={<Navigate to="/bibliothecaire/dashboard" replace />} />
            <Route path="/ecole/bibliothecaire" element={
              <ProtectedRoute allowedRoles={['bibliothecaire', 'directeur']}>
                <DashboardBibliothecaire />
              </ProtectedRoute>
            } />

            <Route path="/secretaire/dashboard" element={
              <ProtectedRoute allowedRoles={['secretaire']}>
                <DashboardSecretaire />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-secretaire" element={<Navigate to="/secretaire/dashboard" replace />} />
            <Route path="/ecole/secretaire" element={
              <ProtectedRoute allowedRoles={['secretaire', 'directeur']}>
                <DashboardSecretaire />
              </ProtectedRoute>
            } />

            {/* ============ ADMIN ============ */}
            <Route path="/admin/ecoles" element={
              <ProtectedRoute allowedRoles={['directeur']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/ecole/admin" element={
              <ProtectedRoute allowedRoles={['directeur', 'admin']}>
                <DashboardDirecteur />
              </ProtectedRoute>
            } />

            {/* ============ GESTION SCOLAIRE (Protégée) ============ */}
            <Route path="/matieres" element={
              <ProtectedRoute allowedRoles={['directeur', 'enseignement', 'enseignementP', 'enseignementM', 'directeurM', 'directeurP', 'directeurS']}>
                <Matieres />
              </ProtectedRoute>
            } />
            <Route path="/exercices" element={
              <ProtectedRoute allowedRoles={['enseignement', 'enseignementP', 'enseignementM', 'directeur', 'directeurM', 'directeurP', 'directeurS']}>
                <GestionExercices />
              </ProtectedRoute>
            } />
            <Route path="/cahier-texte" element={
              <ProtectedRoute allowedRoles={['enseignement', 'enseignementP', 'enseignementM', 'directeur', 'directeurM', 'directeurP', 'directeurS']}>
                <CahierTexte />
              </ProtectedRoute>
            } />

            {/* ============ UNIVERSITÉ (Protégée) ============ */}
            <Route path="/universite/*" element={
              <ProtectedRoute allowedRoles={['recteur', 'doyen', 'professeur', 'etudiant', 'personnel', 'directeur', 'super-admin', 'admin']}>
                <UniversiteRoutes />
              </ProtectedRoute>
            } />

            {/* ============ FALLBACK ============ */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;