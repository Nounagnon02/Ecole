// src/components/admin/AdminNavbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const StudentNavbar = () => (
  <nav>
    <ul>
      <li><Link to="/">Accueil</Link></li>
      <li><Link to="/sessions/add">Ajouter une session</Link></li>
      <li><Link to="/matieres/add">Ajouter une matière</Link></li>
      <li><Link to="/admin-dashboard/admin/sessions">Sessions d'examen</Link></li>
      <li><Link to="/matieres">Matières</Link></li>
      <li><Link to="/candidats">Candidats</Link></li>
      <li><Link to="/envoyer_email">Envoyer Emails de convocation</Link></li>
    </ul>
  </nav>
);

export default StudentNavbar;
