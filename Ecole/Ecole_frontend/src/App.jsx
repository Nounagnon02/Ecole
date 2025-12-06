import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleBasedRedirect from './auth/RoleBasedRedirect';
import LoginForm from './components/LoginForm';

// Import dashboards
import DashboardDirecteur from './Directeurs/dash';
import DashboardEnseignant from './Enseignants/DashboardEnseignant';
import DashboardEleve from './Eleves/DashboardEleve';
import DashboardParent from './Parents/dash';
import DashboardComptable from './Comptable/DashboardComptable';
import DashboardSurveillant from './Surveillant/DashboardSurveillant';
import DashboardCenseur from './Censeur/DashboardCenseur';
import DashboardInfirmier from './Infirmier/DashboardInfirmier';
import DashboardBibliothecaire from './Bibliothecaire/DashboardBibliothecaire';
import DashboardSecretaire from './Secretaire/DashboardSecretaire';
import EcoleManagement from './components/EcoleManagement';
import UniversiteRoutes from './Universite/UniversiteRoutes';

const UnauthorizedPage = () => (
  <div className="error-container">
    <h1>Accès non autorisé</h1>
    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/connexion" element={<LoginForm />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/dashboard" element={<RoleBasedRedirect />} />
          
          {/* Protected routes by role */}
          <Route path="/directeur/dashboard" element={
            <ProtectedRoute requiredRole="directeur">
              <DashboardDirecteur />
            </ProtectedRoute>
          } />
          
          <Route path="/enseignant/dashboard" element={
            <ProtectedRoute requiredRole="enseignant">
              <DashboardEnseignant />
            </ProtectedRoute>
          } />
          
          <Route path="/eleve/dashboard" element={
            <ProtectedRoute requiredRole="eleve">
              <DashboardEleve />
            </ProtectedRoute>
          } />
          
          <Route path="/parent/dashboard" element={
            <ProtectedRoute requiredRole="parent">
              <DashboardParent />
            </ProtectedRoute>
          } />
          
          <Route path="/comptable/dashboard" element={
            <ProtectedRoute requiredRole="comptable">
              <DashboardComptable />
            </ProtectedRoute>
          } />
          
          <Route path="/surveillant/dashboard" element={
            <ProtectedRoute requiredRole="surveillant">
              <DashboardSurveillant />
            </ProtectedRoute>
          } />
          
          <Route path="/censeur/dashboard" element={
            <ProtectedRoute requiredRole="censeur">
              <DashboardCenseur />
            </ProtectedRoute>
          } />
          
          <Route path="/infirmier/dashboard" element={
            <ProtectedRoute requiredRole="infirmier">
              <DashboardInfirmier />
            </ProtectedRoute>
          } />
          
          <Route path="/bibliothecaire/dashboard" element={
            <ProtectedRoute requiredRole="bibliothecaire">
              <DashboardBibliothecaire />
            </ProtectedRoute>
          } />
          
          <Route path="/secretaire/dashboard" element={
            <ProtectedRoute requiredRole="secretaire">
              <DashboardSecretaire />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/ecoles" element={
            <ProtectedRoute requiredRole="directeur">
              <EcoleManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/universite/*" element={<UniversiteRoutes />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;