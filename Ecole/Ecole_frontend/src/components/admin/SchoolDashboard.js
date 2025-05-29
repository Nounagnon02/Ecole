import React from 'react';
import { Link } from 'react-router-dom';
import './SchoolDashboard.css'; // Import du fichier CSS

const SchoolDashboard = () => {
  return (
    <div className="school-dashboard">
      <h2 className="dashboard-title">Tableau de Bord École</h2>
      <nav className="dashboard-nav">
        <ul>
          <li><Link to="school/candidats/add">Ajouter un Candidat</Link></li>
          <li><Link to="school/sessions">Sessions d'examen</Link></li>
        </ul>
      </nav>
      <p className="welcome-message">Bienvenue sur le tableau de bord de l'école !</p>
    </div>
  );
};

export default SchoolDashboard;
