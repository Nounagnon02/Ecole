import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import SchoolDashboard from './SchoolDashboard';
import CandidateDashboard from './CandidateDashboard';
import ProtectedRoute from './ProtectedRoute'; // Importez le composant de route protégée

const App = () => {
    const [user, setUser] = useState(null); // État pour stocker l'utilisateur

    return (
        <Router>
                        <Navigation user={user} /> 
            <Routes>
                <Route path="/" element={<Login setUser={setUser} />} />
                
                {/* Routes protégées */}
                <Route 
                    path="/admin" 
                    element={
                        <ProtectedRoute 
                            element={<AdminDashboard />} 
                            user={user} 
                            allowedRoles={['admin']} 
                        />
                    } 
                />
                <Route 
                    path="/school" 
                    element={
                        <ProtectedRoute 
                            element={<SchoolDashboard />} 
                            user={user} 
                            allowedRoles={['school', 'admin']} 
                        />
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute 
                            element={<CandidateDashboard />} 
                            user={user} 
                            allowedRoles={['candidate', 'school', 'admin']} 
                        />
                    } 
                />
                {/* Ajoutez d'autres routes selon vos besoins */}
            </Routes>
        </Router>
    );
};

export default App;
