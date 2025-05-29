// src/components/admin/AdminDashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div>
         <li><Link to="/">Accueil</Link></li>
         <li><Link to="/sessions/add">Ajouter une session</Link></li>
            <li><Link to="/admin-dashboard/admin/sessions">Sessions d'examen</Link></li>
            <li><Link to="/matieres/add">Ajouter une matière</Link></li>
            <li><Link to="/matieres">Matières</Link></li>
           
            <li><Link to="/envoyer_email">Envoyer Emails de convocation</Link></li>
      <h2>Tableau de Bord Administrateur</h2>
      <p>Bienvenue sur votre tableau de bord, Administrateur !</p>
    </div>
  );
};

export default AdminDashboard;
