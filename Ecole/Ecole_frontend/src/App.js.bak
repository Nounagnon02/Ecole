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
import DashboardComptable from './Comptable/DashboardComptable';
import DashboardSurveillant from './Surveillant/DashboardSurveillant';
import DashboardInfirmier from './Infirmier/DashboardInfirmier';
import DashboardBibliothecaire from './Bibliothecaire/DashboardBibliothecaire';
import Home from './home/home.jsx';
import EcoleManagement from './components/EcoleManagement';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { ConnexionU } from './université/Auth/Connexion.jsx';
import DashboardEtudiant from './Universite/DashboardEtudiant.jsx';
import DashboardRecteur from './Universite/DashboardRecteur.jsx';
import GestionEtudiants from './Universite/GestionEtudiants.jsx';
import GestionFacultes from './Universite/GestionFacultes.jsx';
import GestionDepartements from './Universite/GestionDepartements.jsx';
import GestionFilieres from './Universite/GestionFilieres.jsx';
import GestionEnseignants from './Universite/GestionEnseignants.jsx';
import GestionMatieres from './Universite/GestionMatieres.jsx';
import GestionNotes from './Universite/GestionNotes.jsx';
import UniversiteLayout from './Universite/UniversiteLayout';
import GestionExercices from './components/GestionExercices';
import CahierTexte from './components/CahierTexte';


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
                    <Route path="/admin/ecoles" element={


                        <SuperAdminDashboard />


                    } />
                    <Route path="/" element={<Home />} />
                    <Route path="/dash2" element={<DashboardEleve />} />
                    <Route path="/dash1" element={<DashboardEnseignant />} />
                    <Route path="/dash" element={<DashboardSecretaire />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/paiement" element={<PaymentForm />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dash" element={<DashboardE />} />
                    <Route path="/connexion" element={<Connexion />} />
                    <Route path="/connexionE" element={<ConnexionU />} />

                    <Route path="/inscription" element={<InscriptionE />} />
                    <Route path="/matieres" element={<Matieres />} />
                    <Route path="/exercices" element={<GestionExercices />} />
                    <Route path="/cahier-texte" element={<CahierTexte />} />

                    <Route path="etudiant" element={<DashboardEtudiant />} />

                    {/* Routes Universitaires */}
                    <Route path="/universite" element={<UniversiteLayout />}>
                        <Route path="etudiant" element={<DashboardEtudiant />} />
                        <Route path="recteur" element={<DashboardRecteur />} />
                        <Route path="etudiants" element={<GestionEtudiants />} />
                        <Route path="facultes" element={<GestionFacultes />} />
                        <Route path="departements" element={<GestionDepartements />} />
                        <Route path="filieres" element={<GestionFilieres />} />
                        <Route path="enseignants" element={<GestionEnseignants />} />
                        <Route path="matieres" element={<GestionMatieres />} />
                        <Route path="notes" element={<GestionNotes />} />
                    </Route>

                    <Route path="/ecole" >
                        <Route path="admin" element={<Dashboard />} />
                        <Route path="maternelle" element={<DashboardM />} />
                        <Route path="primaire" element={<DashboardP />} />
                        <Route path="secondaire" element={<DashboardS />} />
                        <Route path="censeur" element={<DashboardCenseur />} />
                        <Route path="surveillant" element={<DashboardSurveillant />} />
                        <Route path="secretaire" element={<DashboardSecretaire />} />
                        <Route path="comptable" element={<DashboardComptable />} />
                        <Route path="infirmier" element={<DashboardInfirmier />} />
                        <Route path="bibliothecaire" element={<DashboardBibliothecaire />} />
                        <Route path="enseignant/secondaire" element={<DashboardEnseignantSecondaire />} />
                        <Route path="enseignant/primaire" element={<DashboardEnseignantPrimaire />} />
                        <Route path="enseignant/maternelle" element={<DashboardEnseignantPrimaire />} />
                    </Route>
                    {/*<Route path="/paiement" element={<KKiaPayPayment />} />*/}
                    {/*<Route path="/" element={<Connexion />} />*/}

                    <Route path="/dashboard-eleve" element={
                        <ProtectedRoute allowedRoles={['eleve']}>
                            <DashboardE />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-admin" element={
                        <ProtectedRoute allowedRoles={['directeur', 'admin']}>
                            < Dashboard />
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
                            <DashboardSurveillant />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-secretaire" element={
                        <ProtectedRoute allowedRoles={['secretaire']}>
                            <DashboardSecretaire />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard-comptable" element={
                        <ProtectedRoute allowedRoles={['comptable']}>
                            <DashboardComptable />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/dashboard-infirmier" element={
                        <ProtectedRoute allowedRoles={['infirmier']}>
                            <DashboardInfirmier />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/dashboard-bibliothecaire" element={
                        <ProtectedRoute allowedRoles={['bibliothecaire']}>
                            <DashboardBibliothecaire />
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