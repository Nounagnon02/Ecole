import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';      
import ProtectedRoute from './ProtectedRoute';
import AuthProvider from './AuthContext';

// Lazy load all dashboard components to reduce initial bundle size
const InscriptionE = React.lazy(() => import('./Ecoliers/Inscription').then(module => ({ default: module.InscriptionE })));
const Connexion = React.lazy(() => import('./Ecoliers/Connexion').then(module => ({ default: module.Connexion })));
const DashboardE = React.lazy(() => import('./Ecoliers/dash'));
const Dashboard = React.lazy(() => import('./Directeurs/dash'));
const Matieres = React.lazy(() => import('./Directeurs/Matieres'));
const Classes = React.lazy(() => import('./Directeurs/Classes'));
const ParentDashboard = React.lazy(() => import('./Parents/dash'));
const Dashboard_Secretaire = React.lazy(() => import('./Secretaire/dashboard'));
const DashboardM = React.lazy(() => import('./DirecteursM/dash'));
const DashboardP = React.lazy(() => import('./DirecteursP/dash'));
const DashboardS = React.lazy(() => import('./DirecteursS/dash'));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
    }}>
        <div>
            <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3', 
                borderTop: '4px solid #3498db', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px'
            }}></div>
            Chargement...
        </div>
        <style>
            {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}
        </style>
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/dash" element={<DashboardE />} />
                        <Route path="/connexion" element={<Connexion />} />
                        <Route path="/inscription" element={<InscriptionE />} />
                        <Route path="/matieres" element={<Matieres />} />
                        <Route path="/classes" element={<Classes />} />
                        <Route path="/" element={<Connexion />} />

                        <Route path="/dashboard-eleve" element={
                            <ProtectedRoute allowedRoles={['eleve']}>
                                <DashboardE />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard-admin" element={
                            <ProtectedRoute allowedRoles={['directeur', 'admin']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-maternelle" element={
                            <ProtectedRoute allowedRoles={['directeurM']}>
                                <DashboardM />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-primaire" element={
                            <ProtectedRoute allowedRoles={['directeurP']}>
                                <DashboardP />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-secondaire" element={
                            <ProtectedRoute allowedRoles={['directeurS']}>
                                <DashboardS />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-censeur" element={
                            <ProtectedRoute allowedRoles={['censeur']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-surveillant" element={
                            <ProtectedRoute allowedRoles={['surveillant']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-secretaire" element={
                            <ProtectedRoute allowedRoles={['secretaire']}>
                                <Dashboard_Secretaire />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-comptable" element={
                            <ProtectedRoute allowedRoles={['comptable']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-enseignement" element={
                            <ProtectedRoute allowedRoles={['enseignement']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-enseignementM" element={
                            <ProtectedRoute allowedRoles={['enseignementM']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-enseignementP" element={
                            <ProtectedRoute allowedRoles={['enseignementP']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard-parent" element={
                            <ProtectedRoute allowedRoles={['parent']}>
                                <ParentDashboard />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </Router>
    );
}

export default App;