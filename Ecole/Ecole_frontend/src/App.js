import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';      
import { InscriptionE } from './Ecoliers/Inscription';
import { Connexion } from './Ecoliers/Connexion';
import DashboardE from './Ecoliers/dash';
import Dashboard from './Directeurs/dash';
import ProtectedRoute from './ProtectedRoute';
import AuthProvider from './AuthContext';
import Matieres from './Directeurs/Matieres';
import Classes from './Directeurs/Classes';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
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
                            <Dashboard />
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
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;