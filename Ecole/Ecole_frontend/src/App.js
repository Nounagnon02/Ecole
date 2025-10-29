import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';      
import { InscriptionE } from './Ecoliers/Inscription';
import { Connexion } from './Ecoliers/Connexion';
import DashboardE from './Ecoliers/dash';
import Dashboard from './Directeurs/dash';
import ProtectedRoute from './ProtectedRoute';
import AuthProvider from './AuthContext';
import Matieres from './Directeurs/Matieres';
import DashboardSecretaire from './Secretaire/DashboardSecretaire';
import DashboardEnseignant from './Enseignants/DashboardEnseignant';
import DashboardEnseignantPrimaire from './Enseignants_primaire/DashboardEnseignantPrimaire';
import DashboardEnseignantSecondaire from './Enseignants_secondaire/DashboardEnseignantSecondaire';
import DashboardEleve from './Eleves/DashboardEleve';
import DashboardCenseur from './Censeur/DashboardCenseur';

import ParentDashboard from './Parents/dash';
import DashboardM from './DirecteursM/dash';
import DashboardP from './DirecteursP/dash';
import DashboardS from './DirecteursS/dash';
import PaymentForm from './paiements/paiement';
import PaymentSuccess from './paiements/paiementSucces';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/dash2" element={<DashboardEleve />} />
                    <Route path="/dash1" element={<DashboardEnseignant />} />
                    <Route path="/dash" element={<DashboardSecretaire />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/paiement" element={<PaymentForm />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dash" element={<DashboardE />} />
                    <Route path="/connexion" element={<Connexion />} />
                    <Route path="/inscription" element={<InscriptionE />} />
                    <Route path="/matieres" element={<Matieres />} />
                    {/*<Route path="/paiement" element={<KKiaPayPayment />} />*/}
                    <Route path="/" element={<Connexion />} />

                    <Route path="/dashboard-eleve" element={
                        <ProtectedRoute allowedRoles={['eleve']}>
                            <DashboardE />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/dashboard-admin" element={
                        <ProtectedRoute allowedRoles={['directeur', 'admin']}>
                            < Dashboard/>
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
                            <DashboardCenseur />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-surveillant" element={
                        <ProtectedRoute allowedRoles={['surveillant']}>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-secretaire" element={
                        <ProtectedRoute allowedRoles={['secretaire']}>
                            <DashboardSecretaire />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-comptable" element={
                        <ProtectedRoute allowedRoles={['comptable']}>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-enseignant" element={
                        <ProtectedRoute allowedRoles={['enseignement']}>
                            <DashboardEnseignantSecondaire />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-enseignementM" element={
                        <ProtectedRoute allowedRoles={['enseignementM']}>
                            <DashboardEnseignantPrimaire />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-enseignementP" element={
                        <ProtectedRoute allowedRoles={['enseignementP']}>
                            <DashboardEnseignantPrimaire />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard-parent" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                            <ParentDashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;