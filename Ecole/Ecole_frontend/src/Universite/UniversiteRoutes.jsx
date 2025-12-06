import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardRecteur from './DashboardRecteur';
import GestionEtudiants from './GestionEtudiants';
import GestionFacultes from './GestionFacultes';
import GestionDepartements from './GestionDepartements';
import GestionFilieres from './GestionFilieres';
import GestionEnseignants from './GestionEnseignants';
import GestionMatieres from './GestionMatieres';
import GestionNotes from './GestionNotes';
import DashboardEtudiant from './DashboardEtudiant';

const UniversiteRoutes = () => {
  return (
    <Routes>
      <Route path="/recteur" element={<DashboardRecteur />} />
      <Route path="/etudiants" element={<GestionEtudiants />} />
      <Route path="/facultes" element={<GestionFacultes />} />
      <Route path="/departements" element={<GestionDepartements />} />
      <Route path="/filieres" element={<GestionFilieres />} />
      <Route path="/enseignants" element={<GestionEnseignants />} />
      <Route path="/matieres" element={<GestionMatieres />} />
      <Route path="/notes" element={<GestionNotes />} />
      <Route path="/etudiant" element={<DashboardEtudiant />} />
    </Routes>
  );
};

export default UniversiteRoutes;
