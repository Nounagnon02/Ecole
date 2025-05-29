// src/components/admin/AdminNavbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const SchoolNavbar = () => (
  <nav>
    
    <ul>
          <li><Link to="school/candidats/add">Ajouter un Candidat</Link></li>
          <li><Link to="school/candidats">Candidats</Link></li>
          <li><Link to="school/sessions">Sessions d'examen</Link></li>
          <li><Link to="school/candidats/add">Ajouter un candidat</Link></li>
        </ul>
   
  </nav>
);

export default SchoolNavbar;
